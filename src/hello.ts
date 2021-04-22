// import * as usersData from "./UserData.json";
// import * as userListData from "./UserList.json";
const userInterest = {};
let Now = 1000;
class Stbank {
  payWithStt(_sender: any, daily: number, referrals: number) {
    this.totalSttSupply += daily + referrals;
    return true;
  }
  withdrawTrx(_sender: string, interest: number, referrals: number) {
    this.totalSttSupply += interest;
    this.users[_sender] -= 700;
    this.contractBalance -= 700;
    return true;
  }
  depositTrx(_sender: any, _value: any): boolean {
    this.contractBalance += _value;
    if (this.users[_sender]) {
      this.users[_sender] += _value;
    } else this.users[_sender] = _value;
    return true;
  }
  contractUserBalance(_user: string): any {
    return this.users[_user];
  }
  users = {};
  contractBalance = 1000000;
  sttPrice = () => Math.floor(this.contractBalance / 1000000);
  totalSttSupply = 0;
}
const STBank = new Stbank();
class emit {
  static WithdrawFromBank(_sender: string, interest: any, arg2: number) {
    if (userInterest[_sender]) {
      userInterest[_sender] += interest;
    } else userInterest[_sender] = interest;
    console.log("Withdraw: ", _sender, interest);
  }
  static RegisterNewUser(_sender: any, arg1: string, arg2: number) {
    console.log("Register: ", _sender, arg1, arg2);
  }
  static DepositToBank(_sender: any, currentPrice: any, arg2: number) {
    console.log("Deposit: ", _sender, currentPrice, arg2);
  }
}

const now = () => {
  return Math.floor(Now / 1000);
};

let STT_LIMIT = 100000000000000000000;
let PERIOD_LENGTH = 37;
let currentLevel = 1;
let REFERRER_1_LEVEL_LIMIT = 3;
let LEVELS = [3, 9, 27, 81, 243, 729, 2187];
let PERCENTAGE = [206158436164, 137438957253, 687194786265];

type Address = string;

interface User {
  id: number;
  isExist: boolean;
  startTime: number[];
  referralID: number;
  lastWithdraw: number;
  referrals: Address[];
  refStates: number[];
  refAmounts: number;
}

type Users = {
  [key: string]: User;
};

const users: Users = {};

const userList: {
  [key: number]: string;
} = {};

const profitStat: {
  [key: string]: number;
} = {};

let currUserID = 1;

users["0x0"] = {
  isExist: true,
  referralID: 0,
  id: currUserID,
  startTime: [now()],
  referrals: [],
  refAmounts: 0,
  lastWithdraw: 0,
  refStates: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};
userList[currUserID] = "0x0";

STBank.depositTrx("0x0", 700);

function totalBalance() {
  return STBank.contractBalance;
}

function freezePrice() {
  return STBank.sttPrice() * 700;
}

function regUser(_referrer: Address, _sender: Address, _value: number) {
  requires(!users[_sender]?.isExist, "Error::Refferal, User exist!");
  let currentPrice = freezePrice();
  requires(_value == currentPrice, "Error::Refferal, Incorrect Value!");
  requires(
    STBank.totalSttSupply < STT_LIMIT,
    "Error::Refferal, New user could not be added anymore!"
  );
  let _referrerID;

  if (users[_referrer]?.isExist) {
    _referrerID = users[_referrer].id;
  } else if (_referrer == "") {
    _referrerID = findRandomFreeReferrer();
  } else {
    requires(false, "Error::Refferal, Incorrect referrer!");
  }
  console.log(_referrerID, currUserID);
  requires(
    _referrerID > 0 && _referrerID <= currUserID,
    "Error::Refferal, Incorrect referrer Id!"
  );

  if (
    users[userList[_referrerID]]?.referrals.length >= REFERRER_1_LEVEL_LIMIT
  ) {
    _referrerID = users[findMostFreeReferrals(userList[_referrerID])]?.id;
  }

  requires(
    STBank.depositTrx(_sender, _value),
    "Error::Refferal, Deposit failed!"
  );
  currUserID++;

  users[_sender] = {
    isExist: true,
    id: currUserID,
    referralID: _referrerID,
    startTime: [],
    referrals: [],
    lastWithdraw: 0,
    refAmounts: 0,
    refStates: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  };
  userList[currUserID] = _sender;

  if (users[userList[_referrerID]]) {
    users[userList[_referrerID]].referrals.push(_sender);
  }
  console.log("refferal: ", _referrerID);
  let lastRefParent = currUserID;
  for (let i = 0; i < 15; i++) {
    let refParent = users[userList[lastRefParent]]?.referralID;
    if (refParent != lastRefParent) {
      if (users[userList[refParent]]) {
        users[userList[refParent]].refStates[i] += 1;
        if (userBalance(userList[refParent]) >= currentPrice) {
          users[userList[refParent]].refAmounts += PERCENTAGE[i < 2 ? i : 2];
        }
      }
      lastRefParent = refParent;
    }
    if (lastRefParent == 1) break;
  }
  users[_sender].startTime.push(now());

  emit.RegisterNewUser(_sender, userList[_referrerID], now());
}

function updatePrice(_sender: Address, _value: number) {
  requires(users[_sender]?.isExist, "Error::Refferal, User not exist!");
  requires(
    STBank.totalSttSupply < STT_LIMIT,
    "Error::Refferal, We reach the cap!"
  );

  let currentPrice = freezePrice();

  requires(
    userBalance(_sender) + _value == currentPrice,
    "Error:: Refferal, Incorrect Value!"
  );

  requires(
    STBank.depositTrx(_sender, _value),
    "Error::Refferal, Deposit failed!"
  );

  let lastRefParent = users[_sender].id;
  for (let i = 0; i < 15; i++) {
    let refParent = users[userList[lastRefParent]]?.referralID;
    if (refParent != lastRefParent) {
      if (users[userList[refParent]]) {
        if (userBalance(userList[refParent]) >= currentPrice) {
          users[userList[refParent]].refAmounts += PERCENTAGE[i < 2 ? i : 2];
        }
      }
      lastRefParent = refParent;
    }
    if (lastRefParent == 0) break;
  }

  users[_sender].startTime.push(now());

  emit.DepositToBank(_sender, currentPrice, now());
}

function withdrawFromBank(_sender: Address) {
  requires(userExpired(_sender), "Error::Refferal, User is not expired!");

  const [daily, referrals, withdrawTime] = calculateInterest(_sender);

  requires(
    STBank.withdrawTrx(_sender, daily, referrals),
    "Error::Refferal, Withdraw failed!"
  );
  users[_sender].refAmounts -= referrals;
  users[_sender].lastWithdraw = withdrawTime;
  emit.WithdrawFromBank(_sender, daily, now());
}

function calculateInterest(_sender: Address) {
  requires(users[_sender]?.isExist, "Error::Refferal, User not exist!");
  let userBalances = userBalance(_sender);
  let currentPrice = freezePrice();

  requires(userBalances > 0, "Error::Refferal, User dosen't have value!");

  let daily = 0;
  let referral = 0;
  let withdrawTime = 0;

  for (let i = 0; i < users[_sender].startTime.length; i++) {
    let lastAmount = 0;
    withdrawTime = now() - users[_sender].startTime[i];
    if (withdrawTime > 37) withdrawTime = 37;
    if (users[_sender].lastWithdraw < 37) {
      if (users[_sender].lastWithdraw > 0)
        lastAmount = 2 ** users[_sender].lastWithdraw * 50;
      daily += 2 ** withdrawTime * 50 - lastAmount;
    }
  }

  console.log("daily: %s, time: %s", daily, withdrawTime);

  if (userBalances == currentPrice) {
    referral = users[_sender].refAmounts;
  }

  return [daily, referral, withdrawTime];
}

function withdrawIntrest(_sender: Address) {
  let [daily, referrals, withdrawTime] = calculateInterest(_sender);

  requires(
    STBank.payWithStt(_sender, daily, referrals),
    "Error::Refferal, Withdraw failed!"
  );

  users[_sender].refAmounts -= referrals;
  users[_sender].lastWithdraw = withdrawTime;

  emit.WithdrawFromBank(_sender, daily + referrals, withdrawTime);
}

function findMostFreeReferrals(_user: Address) {
  if (users[_user].referrals.length < REFERRER_1_LEVEL_LIMIT) {
    return _user;
  }

  let currentLevel = completedLevel(_user);

  let freeReferrer;
  let noFreeReferrer = true;

  if (currentLevel != 0) {
    console.log("currentLevel: ", currentLevel);
    const [members, startLoop] = totalMembers(currentLevel);
    console.log("Members: %s, StartLoop: %s", members, startLoop);
    let referrals = new Array(members);

    referrals[0] = users[_user].referrals[0];
    referrals[1] = users[_user].referrals[1];
    referrals[2] = users[_user].referrals[2];

    for (let i = 0; i < startLoop; i++) {
      for (let m = 0; m < 3; m++) {
        if (users[referrals[i]].referrals[m] != "") {
          referrals[(i + 1) * 3 + m] = users[referrals[i]]?.referrals[m];
        } else {
          break;
        }
      }
    }

    for (let l = 0; l < 3; l++) {
      for (let k = startLoop; k < members; k++) {
        if (users[referrals[k]]?.referrals.length == l) {
          noFreeReferrer = false;
          freeReferrer = referrals[k];
          break;
        }
      }
      if (!noFreeReferrer) {
        break;
      }
    }
  }
  if (noFreeReferrer) {
    freeReferrer = userList[findRandomFreeReferrer()];
    console.log(freeReferrer);
  }
  console.log("-----------------------");
  return freeReferrer;
}

function completedLevel(_user: Address) {
  for (let i = 0; i < LEVELS.length; i++) {
    if (users[_user].refStates[i] < LEVELS[i]) {
      return i;
    }
  }
}

function totalMembers(_level: number) {
  let members = 0;
  let startLoop = 0;
  if (_level == 1) return [3, 0];
  for (let i = 0; i < _level; i++) {
    if (i > 0) startLoop = startLoop + LEVELS[i - 1];
    members = members + LEVELS[i];
  }
  return [members, startLoop];
}

function findRandomFreeReferrer() {
  for (let i = currUserID / 2; i < 500 + currUserID / 2; i++) {
    if (users[userList[i]]?.referrals.length == 0) {
      return i;
    }
  }
}

function userReferralList(_user: Address) {
  return users[_user].refStates;
}

function userReferrals(_user: Address) {
  return users[_user].referrals;
}

function userBalance(_user: Address) {
  return STBank.contractUserBalance(_user);
}

function userExpired(_user: Address) {
  for (let i = 0; i < users[_user].startTime.length; i++) {
    if (users[_user].startTime[i] + PERIOD_LENGTH > now()) return false;
    else true;
  }
}
function requires(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(msg);
  }
}
function currentLevelPrice(): any {
  return currentLevel * 700;
}

export function StartLoop() {
  // currentLevel = 2;
  for (let n = 1; n < 1429; n++) {
    // if (n > 1) {
    //   currentLevel = 2;
    //   if (n > 3000000) currentLevel = 4;
    regUser(`0x${Math.floor(Math.random() * n)}`, `0x${n}`, 700);
    // }
    // else regUser("", `0x${n}`,
  }
  for (let n = 1429; n < 2130; n++) {
    // if (n > 1) {
    //   currentLevel = 2;
    //   if (n > 3000000) currentLevel = 4;
    regUser(`0x${Math.floor(Math.random() * n)}`, `0x${n}`, 1400);
    // }
    // else regUser("", `0x${n}`,
  }
  for (let n = 0; n < 200; n++) {
    // if (n > 1) {
    //   currentLevel = 2;
    //   if (n > 3000000) currentLevel = 4;
    withdrawIntrest(`0x${n}`);
    // }
    // else regUser("", `0x${n}`,
  }
  Now = 3000;
  for (let n = 0; n < 200; n++) {
    // if (n > 1) {
    //   currentLevel = 2;
    //   if (n > 3000000) currentLevel = 4;
    updatePrice(`0x${n}`, 700);
    // }
    // else regUser("", `0x${n}`,
  }
  Now = 6000;
  for (let n = 0; n < 2000; n++) {
    // if (n > 1) {
    //   currentLevel = 2;
    //   if (n > 3000000) currentLevel = 4;
    withdrawIntrest(`0x${n}`);
    // }
    // else regUser("", `0x${n}`,
  }
  Now = 38000 * 2;
  for (let n = 0; n < 2000; n++) {
    // if (n > 1) {
    //   currentLevel = 2;
    //   if (n > 3000000) currentLevel = 4;
    withdrawFromBank(`0x${n}`);
    // }
    // else regUser("", `0x${n}`,
  }
  // currentLevel = 3;
  for (let n = 10000; n < 20000; n++) {
    // if (n > 1) {
    //   currentLevel = 2;
    //   if (n > 3000000) currentLevel = 4;
    regUser(
      `0x${Math.floor(Math.random() * 200)}`,
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
// console.log("LevelState", refStates);
// console.log("List", userList);
// console.log("UserComplete", userRefComplete);
// console.log(profitStat);
