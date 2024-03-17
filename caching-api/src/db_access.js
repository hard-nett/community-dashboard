const UPDATE_DESPITE_LOCK_TIME = 120000;
function saveToDb(db, key, currentData) {
  return db.set(key, JSON.stringify(currentData));
}
async function getDb(db, key) {
  const dbData = await db.get(key);
  return JSON.parse(dbData);
}
async function acquireUpdateLock(lock, key) {
  return await lock.acquire([key + 'updateLock'], UPDATE_DESPITE_LOCK_TIME);
}
async function releaseUpdateLock(lock) {
  await lock
    .release()
    .catch((error) => console.log("Couldn't release lock", error));
}
export { saveToDb, getDb, acquireUpdateLock, releaseUpdateLock };
