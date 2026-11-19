import { HttpError, validId } from '../utils/httpError.js';

export function catalogController(repo, recommendations) {
  const users = (_req,res) => res.json(repo.listUsers());
  const products = (_req,res) => res.json(repo.listProducts());
  const user = (req,res) => {
    const id=validId(req.params.id);
    const value=repo.findUser(id);
    if (!value) throw new HttpError(404,'Usuário não encontrado');
    res.json({ ...value, purchases: repo.listPurchases(id) });
  };
  const recommend = async (req,res) => {
    const id=validId(req.params.id);
    const limit=Number(req.query.limit ?? 5);
    if (!Number.isSafeInteger(limit)||limit<1||limit>50) throw new HttpError(400,'limit deve estar entre 1 e 50');
    const result=await recommendations.recommend(id,limit,String(req.query.mode??'hybrid'));
    if (!result) throw new HttpError(404,'Usuário não encontrado');
    res.json(result);
  };
  const buy = async (req,res) => {
    const id=validId(req.params.id);
    const pid=validId(req.body?.productId);
    if (!repo.findUser(id)) throw new HttpError(404,'Usuário não encontrado');
    if (!repo.findProduct(pid)) throw new HttpError(404,'Produto não encontrado');
    const inserted=repo.addPurchase(id,pid);
    if (!inserted) throw new HttpError(409,'Produto já comprado');
    let synced=true;
    try { await recommendations.refreshUser(id); }
    catch(err) { synced=false; console.warn('Reindexação adiada:',err.message); }
    res.status(synced?201:202).json({ userId:id, productId:pid, indexSynced:synced });
  };
  const remove = async (req,res) => {
    const id=validId(req.params.id), pid=validId(req.params.productId);
    if (!repo.findUser(id)) throw new HttpError(404,'Usuário não encontrado');
    if (!repo.removePurchase(id,pid)) throw new HttpError(404,'Compra não encontrada');
    let synced=true;
    try { await recommendations.refreshUser(id); }
    catch(err) { synced=false; console.warn('Reindexação adiada:',err.message); }
    res.json({ userId:id, productId:pid, removed:true, indexSynced:synced });
  };
  return { users, products, user, recommend, buy, remove };
}
