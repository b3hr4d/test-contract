StartLoop();
var userPoint = 10;

var search = (tree) => {
  if (tree.referrals.length === 0) return;

  tree.referrals.forEach((el, i) => {
    search(users[el]);
    tree.referrals[i] = users[el];
    userPoint += users[el].widthrawAmount;
  });
};

function output(inp) {
  document.body.appendChild(document.createElement("pre")).innerHTML = inp;
}

function syntaxHighlight(json) {
  json = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    function (match) {
      var cls = "number";
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "key";
        } else {
          cls = "string";
        }
      } else if (/true|false/.test(match)) {
        cls = "boolean";
      } else if (/null/.test(match)) {
        cls = "null";
      }
      return '<span class="' + cls + '">' + match + "</span>";
    }
  );
}

search(users["0x122"]);
var str2 = JSON.stringify(users["0x122"], undefined, 4);
console.log(userPoint, users["0x122"].referrals.length);
// var str1 = JSON.stringify(users, undefined, 4);
// output(syntaxHighlight(str1));
output(syntaxHighlight(str2));
//# sourceMappingURL=test.js.map
//# sourceMappingURL=test.js.map

// var users = {
//   GOD: {
//     point: 1,
//     id: "GOD",
//     parentId: null,
//     referrals: ["sadegh", "farid"],
//   },
//   sadegh: {
//     point: 1,
//     id: "sadegh",
//     parentId: "GOD",
//     referrals: ["maman", "kave", "who", "sho"],
//   },
//   maman: {
//     point: 1,
//     id: "maman",
//     parentId: "sadegh",
//     referrals: ["reza", "ali", "jasem", "foo"],
//   },
//   farid: {
//     point: 1,
//     id: "farid",
//     parentId: "GOD",
//     referrals: ["behrad", "soroush", "ghasem"],
//   },
//   kave: { point: 1, id: "kave", parentId: "sadegh", referrals: ["bahamin", "moo"] },
//   behrad: { point: 1, id: "behrad", parentId: "farid", referrals: ["hoo"] },
//   jasem: { point: 1, id: "jasem", parentId: "maman", referrals: ["bar"] },
//   hoo: { point: 1, id: "hoo", parentId: "behrad", referrals: ["zoo"] },
//   soroush: { point: 1, id: "soroush", parentId: "farid", referrals: [] },
//   reza: { point: 1, id: "reza", parentId: "maman", referrals: [] },
//   ali: { point: 1, id: "ali", parentId: "maman", referrals: [] },
//   bahamin: { point: 1, id: "bahamin", parentId: "kave", referrals: [] },
//   ghasem: { point: 1, id: "ghasem", parentId: "farid", referrals: [] },
//   bar: { point: 1, id: "bar", parentId: "jasem", referrals: [] },
//   foo: { point: 1, id: "foo", parentId: "maman", referrals: [] },
//   moo: { point: 1, id: "moo", parentId: "kave", referrals: [] },
//   zoo: { point: 1, id: "zoo", parentId: "hoo", referrals: [] },
//   who: { point: 1, id: "who", parentId: "sadegh", referrals: [] },
//   sho: { point: 1, id: "sho", parentId: "sadegh", referrals: [] },
// };
// const idMapping = {};
// users.map((el, i) => {
//   idMapping[el.id] = i;
// });
// console.log(idMapping);
// console.log("version 2");
// var idMapping = users.reduce((acc, el, i) => {
//   acc[el.id] = i;
//   return acc;
// }, {});
