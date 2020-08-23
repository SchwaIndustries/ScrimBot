module.exports = exports = {
  name: 'botAdminCollectionTransfer',
  enabled: true,
  process: async (GLOBALS) => {
    const querySnapshot = await GLOBALS.db.collection('botAdmins').get()
    if (querySnapshot.empty) return // if botAdmins is already migrated then return

    querySnapshot.forEach(async doc => {
      const userDocRef = await GLOBALS.db.collection('users').doc(doc.id)
      userDocRef.update({ admin: true })
        .then(_ => {
          doc.ref.delete()
        })
    })
  }
}
