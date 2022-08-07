// import * as usersData from "./UserData.json";
// import * as userListData from "./UserList.json";
const userInterest = {};
var Now = Math.floor(Date.now() / 1000);
var Day = 86400;
class Stbank {
  payWithStt(_sender: any, daily: number, referrals: number) {
    this.totalSttSupply += daily + referrals;
    return true;
  }
  withdrawTrx(_sender: string, interest: number, referrals: number) {
    this.totalSttSupply += interest;
    const balance = this.users[_sender];
    this.users[_sender] -= balance;
    this.contractBalance -= balance;
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
    if (typeof userInterest[_sender] == "number") {
      userInterest[_sender] = userInterest[_sender] + interest;
    } else userInterest[_sender] = interest;
    //console.log("Withdraw: ", _sender, interest);
  }
  static RegisterNewUser(_sender: any, arg1: string, arg2: number) {
    //console.log("Register: ", _sender, arg1, arg2);
  }
  static DepositToBank(_sender: any, currentPrice: any, arg2: number) {
    //console.log("Deposit: ", _sender, currentPrice, arg2);
  }
}

let STT_LIMIT = 100000000000000000000;
let PERIOD_LENGTH = 730;
let REFERRER_1_LEVEL_LIMIT = 100;
let LEVELS = [3, 9, 27, 81, 243, 729, 2187];
let PERCENTAGE = [206158436164, 137438957253, 687194786265];

type Address = string;

interface User {
  userName: string;
  referralID: string;
  startTimes: number[];
  referrals: Address[];
  withdrawTime: number;
  widthrawAmount: number;
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

users["0x0"] = {
  referralID: null,
  userName: "0x0",
  startTimes: [Now],
  referrals: [],
  withdrawTime: 0,
  widthrawAmount: 1,
};

STBank.depositTrx("0x0", 700);

function totalBalance() {
  return STBank.contractBalance;
}

function freezePrice() {
  return STBank.sttPrice() * 700;
}

function regUser(_referrer: Address, _sender: Address, _value: number) {
  requires(!users[_sender], "Error::Refferal, User exist!");
  let currentPrice = freezePrice();
  requires(_value == currentPrice, "Error::Refferal, Incorrect Value!");
  requires(
    STBank.totalSttSupply < STT_LIMIT,
    "Error::Refferal, New user could not be added anymore!"
  );
  let _referrerID;
  // console.log(_referrer, _sender);
  if (users[_referrer]) {
    _referrerID = users[_referrer].userName;
  } else {
    requires(false, "Error::Refferal, Incorrect referrer!");
  }
  if (_referrerID == undefined) {
    //console.log("here");
  }

  if (
    users[userList[_referrerID]]?.referrals.length >= REFERRER_1_LEVEL_LIMIT
  ) {
    _referrerID = users[findMostFreeReferrals(userList[_referrerID])]?.userName;
  }

  requires(
    STBank.depositTrx(_sender, _value),
    "Error::Refferal, Deposit failed!"
  );

  users[_sender] = {
    userName: _sender,
    referralID: _referrerID,
    referrals: [],
    startTimes: [],
    withdrawTime: 0,
    widthrawAmount: 1,
  };
  userList[_sender] = _sender;

  if (users[userList[_referrerID]]) {
    users[userList[_referrerID]].referrals.push(_sender);
  }

  users[_sender].startTimes.push(Now);

  emit.RegisterNewUser(_sender, userList[_referrerID], Now);
}

function updatePrice(_sender: Address, _value: number) {
  requires(!!users[_sender], "Error::Refferal, User not exist!");
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

  users[_sender].startTimes.push(Now);

  emit.DepositToBank(_sender, currentPrice, Now);
}

function withdrawFromBank(_sender: Address) {
  requires(userExpired(_sender), "Error::Refferal, User is not expired!");

  const [daily, referrals, savedTime] = calculateInterest(_sender);

  requires(
    STBank.withdrawTrx(_sender, daily, referrals),
    "Error::Refferal, Withdraw failed!"
  );
  users[_sender].withdrawTime = savedTime;
  users[_sender].startTimes = [];
  emit.WithdrawFromBank(_sender, daily + referrals, savedTime);
}

function calculateInterest(_sender: Address) {
  requires(!!users[_sender], "Error::Refferal, User not exist!");
  let savedTime = Now;
  let userBalances = userBalance(_sender);
  let currentPrice = freezePrice();

  requires(userBalances > 0, "Error::Refferal, User dosen't have value!");

  let daily = calculateDaily(_sender, savedTime);
  let referral = 0;

  //console.log("dailyAmount: %s, referralAmount: %s", daily, referral);

  return [daily, referral, savedTime];
}

function daysBetween(_time1: number, _time2: number) {
  return Math.floor((_time1 - _time2) / 86400);
}

function calculateDaily(sender: Address, time: number) {
  let daily = 0;
  //console.log("Sender:", sender);
  for (let i = 0; i < users[sender].startTimes.length; i++) {
    let startTime = users[sender].startTimes[i];
    let endTime = startTime + 37 * 86400;
    let withdrawTime = users[sender].withdrawTime;
    if (withdrawTime < endTime) {
      if (startTime > withdrawTime) withdrawTime = startTime;
      let lastAmount = 0;
      let withdrawDay = daysBetween(time, startTime);
      if (withdrawDay > 37) {
        withdrawDay = 37;
      }
      if (withdrawTime > startTime)
        lastAmount = 2 ** daysBetween(startTime, withdrawTime) * 50;
      daily += 2 ** withdrawDay * 50 - lastAmount;
      //console.log(
      //   "should pay %s Day for %s STT, you got %s Day for %s STT before!",
      //   withdrawDay,
      //   (2 ** withdrawDay * 50) / 10 ** 9,
      //   daysBetween(startTime, withdrawTime),
      //   lastAmount / 10 ** 9
      // );
    }
  }
  //console.log("Total:", daily, "\n-------");
  return daily;
}

function withdrawIntrest(_sender: Address) {
  let [daily, referrals, savedTime] = calculateInterest(_sender);

  requires(
    STBank.payWithStt(_sender, daily, referrals),
    "Error::Refferal, Withdraw failed!"
  );

  users[_sender].withdrawTime = savedTime;

  emit.WithdrawFromBank(_sender, daily /* + referrals */, savedTime);
}

function findMostFreeReferrals(_user: Address) {
  return _user;
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

function userReferrals(_user: Address) {
  return users[_user].referrals;
}

function userBalance(_user: Address) {
  return STBank.contractUserBalance(_user);
}

function userExpired(_user: Address) {
  const lastTime = users[_user].startTimes.length - 1;
  return users[_user].startTimes[lastTime] + PERIOD_LENGTH <= Now;
}
function requires(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(msg);
  }
}
function currentLevelPrice(): any {
  return STBank.sttPrice() * 700;
}

function StartLoop() {
  //console.log(Now);
  for (var n = 1; n < 4; n++) {
    regUser("0x" + Math.floor(Math.random() * n), "0x" + n, 700);
  }
  for (var n = 4; n < 7; n++) {
    regUser("0x" + Math.floor(Math.random() * n), "0x" + n, 700);
  }
  for (var n = 7; n < 10; n++) {
    regUser("0x" + Math.floor(Math.random() * n), "0x" + n, 700);
  }
  for (var n = 10; n < 1419; n++) {
    regUser("0x" + Math.floor(Math.random() * n), "0x" + n, 700);
  }
  // updatePrice("0x0", 700);
  // for (var n = 1429; n < 2100; n++) {
  //   regUser("0x0", "0x" + n, 1400);
  // }
  // for (var n = 0; n < 87; n++) {
  //   withdrawIntrest("0x" + n);
  // }
  // Now = Now + Day;
  // for (var n = 0; n < 87; n++) {
  //   updatePrice("0x" + n, 700);
  // }
  // //console.log(Now);
  // for (var n = 0; n < 87; n++) {
  //   withdrawIntrest("0x" + n);
  // }
  // Now = Now + Day * 2;
  // //console.log(Now);
  // for (var n = 0; n < 87; n++) {
  //   withdrawIntrest("0x" + n);
  // }
  // Now = Now + Day * 5;
  // //console.log(Now);
  // for (var n = 0; n < 87; n++) {
  //   withdrawIntrest("0x" + n);
  // }
  // for (var n = 1429; n < 2100; n++) {
  //   regUser("0x" + Math.floor(Math.random() * n), "0x" + n, 1400);
  // }
  // Now = Now + Day * 25;
  // //console.log(Now);
  // for (var n = 0; n < 87; n++) {
  //   withdrawIntrest("0x" + n);
  // }
  // Now = Now + Day * 6;
  // for (var n = 0; n < 87; n++) {
  //   withdrawIntrest("0x" + n);
  // }
  // Now = Now + Day;
  // for (var n = 0; n < 87; n++) {
  //   withdrawIntrest("0x" + n);
  // }
  // //console.log(Now);
  // for (var n = 0; n < 87; n++) {
  //   updatePrice("0x" + n, 700);
  // }
  // Now = Now + Day * 45;
  // for (var n = 87; n < 200; n++) {
  //   updatePrice("0x" + n, 1400);
  // }
  // for (var n = 0; n < 87; n++) {
  //   withdrawIntrest("0x" + n);
  // }
  // Now = Now + Day * 90;
  // for (var n = 0; n < 87; n++) {
  //   withdrawFromBank("0x" + n);
  // }
  // for (var n = 2100; n < 10000; n++) {
  //   regUser(
  //     "0x" + Math.floor(Math.random() * 200),
  //     "0x" + n,
  //     currentLevelPrice()
  //   );
  // }
  // Now = Now + Day * 146;
  // for (var n = 2000; n < 10000; n++) {
  //   withdrawFromBank("0x" + n);
  // }
  // for (var n = 10000; n < 100000; n++) {
  //   regUser("", "0x" + n, currentLevelPrice());
  // }
  // //console.log(users["0x0"]);
  // findMostFreeReferrals("0x2");
  // findMostFreeReferrals("0x100");
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
  //     //console.log(m);
  //   }
  // }

  // //console.log(Users["0x0"]);

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
  //     //console.log(t);
  //   }
  // }
  // //console.log(Users["0x0"]);

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
  //     //console.log(g);
  //   }
  // }
  // //console.log(Users["0x0"]);
}
// //console.log("LevelState", refStates);
// //console.log("List", userList);
// //console.log("UserComplete", userRefComplete);
// //console.log(profitStat);
