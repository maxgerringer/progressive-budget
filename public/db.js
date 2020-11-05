let db;
// Temp database called "budget"
const request = indexedDB.open("budget", 1);

// Create ObjectStore called pending
request.onupgradeneeded = function(e) {
  const db = e.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function(e) {
  db = e.target.result;
  console.log("request result", db);

  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function(e) {
  console.log(e.target.errorCode);
};

// Save to the pending object
function saveRecord(record) {
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  store.add(record);
}

// Check the pending objects and store them once online again
function checkDatabase() {
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => response.json())
      .then(() => {
        const transaction = db.transaction(["pending"], "readwrite");
        const store = transaction.objectStore("pending");
        store.clear();
      });
    }
  };
}

// A listener for when the app comes online again
window.addEventListener("online", checkDatabase);