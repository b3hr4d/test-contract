import * as usersData from "./UserData.json";
import * as userListData from "./UserList.json";

let currentLevel = 1;
let refCompleted = 0;
let REFERRER_1_LEVEL_LIMIT = 3;
let LEVELS = [3, 9, 27, 81, 243, 729, 2187];

type Address = string;

interface user {
  id: number;
  // trx: number;
  // time: number;
  isExist: boolean;
  referralId: number;
  referral: Address[];
  levelStat: number[];
}

type users = {
  [key: string]: user;
};

const Users: users = usersData;

const userList: {
  [key: number]: string;
} = userListData;

const profitStat: {
  [key: string]: number;
} = {};

let levelStat: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

let currUserID = 9999;

// Users["0x0"] = {
//   id: 0,
//   // trx: 700,
//   referral: [],
//   referralId: 0,
//   isExist: true,
//   // time: Date.now(),
//   levelStat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
// };
// userList[currUserID] = "0x0";

function registerUser(_referrerID: number, _sender: Address, _value: number) {
  currUserID++;
  Users[_sender] = {
    id: currUserID,
    // trx: _value,
    referral: [],
    referralId: _referrerID,
    isExist: true,
    // time: Date.now() + 3600,
    levelStat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  };

  userList[currUserID] = _sender;

  Users[userList[_referrerID]].referral.push(_sender);
  Users[userList[_referrerID]].levelStat[0] += 1;

  let lastRefParent = _referrerID;
  for (let i = 1; i < 15; i++) {
    const refParent = Users[userList[lastRefParent]].referralId;
    if (refParent != lastRefParent) {
      Users[userList[refParent]].levelStat[i] += 1;
      lastRefParent = refParent;
    }
    if (lastRefParent == 0) break;
  }
}

function currentLevelPrice() {
  return currentLevel * 700;
}

function regUser(_referrer: Address, _sender: Address, _value: number) {
  if (Users[_sender]?.isExist) {
    console.log("Error::Refferal, User exist");
    return;
  }

  let _referrerID: number;

  if (Users[_referrer]?.isExist) {
    _referrerID = Users[_referrer].id;
  } else if (_referrer == "") {
    _referrerID = findRandomFreeReferrer();
  } else {
    console.log("Error::Refferal, Incorrect referrer");
    return;
  }

  if (_referrerID < 0 || _referrerID >= currUserID + 1) {
    console.log("Error::Refferal, Incorrect referrer Id");
    return;
  }
  if (_value != currentLevelPrice()) {
    console.log("Error::Refferal, Incorrect Value");
    return;
  }

  if (Users[userList[_referrerID]].referral.length >= REFERRER_1_LEVEL_LIMIT) {
    _referrerID = Users[findMostFreeReferrals(userList[_referrerID])].id;
  }

  registerUser(_referrerID, _sender, _value);

  payForLevel(currentLevel, _sender, _referrer, _value);
}

function findMostFreeReferrals(_user: string): string {
  if (Users[_user].referral.length < 3) return _user;

  console.log(Users[_user]);

  let level = completedLevel(_user);

  let noFreeReferrer = true;
  let freeReferrer: string;
  let members = 0;

  if (level) {
    console.log("level: ", level);

    const [members, checkLoop] = totalMembers(_user, level);

    console.log("Members: %s, checkLoop: %s", members, checkLoop);

    let referrals = new Array(members);

    referrals[0] = Users[_user].referral[0];
    referrals[1] = Users[_user].referral[1];
    referrals[2] = Users[_user].referral[2];

    for (let i = 0; i < checkLoop; i++) {
      for (let m = 0; m < 3; m++) {
        if (Users[referrals[i]]?.referral[m]) {
          referrals[(i + 1) * 3 + m] = Users[referrals[i]].referral[m];
        } else {
          break;
        }
      }
      if (referrals[i].length >= members) break;
    }

    console.log(referrals);

    for (let l = 0; l < 3; l++) {
      for (let k = checkLoop; k < members; k++) {
        if (Users[referrals[k]]?.referral.length == l) {
          noFreeReferrer = false;
          freeReferrer = referrals[k];
          break;
        }
      }
      if (freeReferrer) break;
    }
  }
  if (noFreeReferrer) {
    freeReferrer = userList[findRandomFreeReferrer()];
    console.log(freeReferrer);
    if (members != 0) {
      console.log("failed: ", freeReferrer);
    }
  }
  console.log("-----------------------");
  return freeReferrer;
}

function completedLevel(_user: string) {
  for (let i = 0; i < LEVELS.length; i++) {
    if (Users[_user].levelStat[i] < LEVELS[i]) {
      return i;
    }
  }
}

function totalMembers(_user: string, _level: number) {
  let members = 0;
  let checkLoop = 0;
  if (_level == 1) return [3, 0];
  for (let i = 0; i < _level; i++) {
    if (i > 0) checkLoop = checkLoop + LEVELS[i - 1];
    members = members + LEVELS[i];
  }
  return [members, checkLoop];
}

function payForLevel(
  _level: number,
  _user: string,
  referer: Address,
  _value: number
) {
  if (!Users[referer]?.isExist) {
    referer = userList[1];
  }

  if (referer == userList[1]) {
  } else if (!profitStat[referer]) {
    profitStat[referer] = _value;
  } else {
    profitStat[referer] += _value;
  }
  levelStat[_level - 1]++;
}

function findRandomFreeReferrer() {
  refCompleted = Math.floor(currUserID / 2);
  for (let i = refCompleted; i < 500 + refCompleted; i++) {
    if (Users[userList[i]].referral.length != 3) {
      return i;
    }
  }
}

export function StartLoop() {
  currentLevel = 2;
  for (let n = 10000; n < 20000; n++) {
    // if (n > 1) {
    //   currentLevel = 2;
    //   if (n > 3000000) currentLevel = 4;
    regUser(
      `0x${Math.floor(Math.random() * 10000)}`,
      `0x${n}`,
      currentLevelPrice()
    );
    // }
    // else regUser("", `0x${n}`,
  }
  currentLevel = 3;
  for (let n = 20000; n < 100000; n++) {
    // if (n > 1) {
    //   currentLevel = 2;
    //   if (n > 3000000) currentLevel = 4;
    regUser(
      `0x${Math.floor(Math.random() * 10000)}`,
      `0x${n}`,
      currentLevelPrice()
    );
    // }
    // else regUser("", `0x${n}`,
  }
  currentLevel = 4;
  for (let n = 100000; n < 1000000; n++) {
    // if (n > 1) {
    //   currentLevel = 2;
    //   if (n > 3000000) currentLevel = 4;
    regUser("", `0x${n}`, currentLevelPrice());
    // }
    // else regUser("", `0x${n}`,
  }
  console.log(Users["0x0"]);
  findMostFreeReferrals("0x2");
  findMostFreeReferrals("0x100");
  // for (let m = 4000000; m < 8000000; m++) {
  //   if (m > 6000000) {
  //     currentLevel = 8;
  //     if (m > 7000000) currentLevel = 9;
  //     regUser(
  //       `0x${Math.floor(Math.random() * 6000000)}`,
  //       `0x${m}`,
  //       currentLevelPrice()
  //     );
  //   } else regUser(`0x0`, `0x${m}`, currentLevelPrice());
  //   if (m == 7000000) {
  //     console.log(m);
  //   }
  // }

  // console.log(Users["0x0"]);

  // for (let t = 8000000; t < 10000000; t++) {
  //   // if (t > 100) {
  //   //   currentLevel = 2;
  //   //   if (t > 150) currentLevel = 4;
  //   //   regUser(
  //   //     `0x${Math.floor(Math.randot() * 50)}`,
  //   //     `0x${t}`,
  //   //     currentLevelPrice()
  //   //   );
  //   // } else
  //   regUser(`0x0`, `0x${t}`, currentLevelPrice());
  //   if (t == 9000000) {
  //     console.log(t);
  //   }
  // }
  // console.log(Users["0x0"]);

  // for (let g = 10000000; g < 14000000; g++) {
  //   // if (g > 100) {
  //   //   currentLevel = 2;
  //   //   if (g > 150) currentLevel = 4;
  //   //   regUser(
  //   //     `0x${Math.floor(Math.randog() * 50)}`,
  //   //     `0x${g}`,
  //   //     currentLevelPrice()
  //   //   );
  //   // } else
  //   regUser(`0x0`, `0x${g}`, currentLevelPrice());
  //   if (g == 12000000) {
  //     console.log(g);
  //   }
  // }
  // console.log(Users["0x0"]);
}

// console.log("LevelState", levelStat);
// console.log("List", userList);
// console.log("UserComplete", userRefComplete);
// console.log(profitStat);
