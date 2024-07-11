const PouchDB = require("pouchdb");
const db = new PouchDB("system_data");

const displayCollections = async () => {
  try {
    const result = await db.allDocs({ include_docs: true });

    console.log("All documents in the database:");
    result.rows.forEach((row) => {
      console.log(row.doc);
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
  }
};

displayCollections();
