class emit {
  static UpdateUser(userName: string, value: any) {
    console.log("User %s updated with %s Satoshi!", userName, value);
  }
  static WithdrawInterest(userName: string, hourly: number, referrals: number) {
    console.log(
      "Withdraw user %s - hourly: %s - referral: %s",
      userName,
      hourly,
      referrals
    );
  }
  static RegisterUser(userName: string, ref: string, value: any) {
    console.log(
      "Register User: %s, referral: %s, value: %s Satoshi!",
      userName,
      ref,
      value
    );
  }
}
const bnbPair = 122060000000000000000;
const _reserve0 = 3921704870761;
const _reserve1 = 114108007147976719282;
class ISmartWorld {
  balances = {};
  total = 0;
  totalSatoshi = 100000000;
  userStt: { [key: string]: number } = {};
  userAssets(user: any) {
    return this.balances[user];
  }
  userBalance(user: any) {
    return this.balances[user];
  }
  sttPrice() {
    return Math.floor(this.totalSatoshi / 10 ** 8);
  }
  totalSupply() {
    return this.total;
  }
  deposit(user: string, value: number) {
    if (this.balances[user]?.bnb) {
      this.balances[user].bnb = this.balances[user].bnb + value;
      this.balances[user].satoshi =
        this.balances[user].satoshi + this.bnbToSatoshi(value);
    } else {
      this.balances[user] = {
        bnb: value,
        satoshi: this.bnbToSatoshi(value),
      };
    }
    this.totalSatoshi = this.totalSatoshi + this.bnbToSatoshi(value);
    return true;
  }
  depositToken(Token: number, userName: string, value: any): boolean {
    this.balances[userName][Token] = value;
    return true;
  }
  payWithStt(userName: string, value: any): boolean {
    this.userStt[userName] = this.userStt[userName] + value;
    this.total = this.total + value;
    return true;
  }
  btcToSatoshi(_value) {
    return Math.floor(_value / 10 ** 10);
  }

  bnbToSatoshi(_value) {
    return Math.floor((_value * 10 ** 8) / this.btcToBnbPrice());
  }

  sttsToSatoshi(_value) {
    return this.bnbToSatoshi(this.sttsToBnb(_value));
  }

  btcToBnbPrice() {
    return bnbPair;
  }

  sttsToBnb(_value) {
    return Math.floor((_value * 10 ** 18) / this.sttsToBnbPrice());
  }

  sttsToBnbPrice() {
    return Math.floor((_reserve0 * 10 ** 18) / _reserve1);
  }
}
interface Invest {
  reward: number;
  endTime: number;
}
type Users = {
  [key: string]: UserStruct;
};
interface UserStruct {
  id: number;
  refID: number;
  refAmounts: number;
  refPercent: number;
  latestWithdraw: number;
  invest: Invest[];
}

let timeStamp = Math.floor(new Date().getTime() / 1000);
const STT = new ISmartWorld();

const STTS = 0x39342b9f653145e18c69fb2d52a0445d5333a1d8;
const BTCB = 0x6ce8da28e2f864420840cf74474eff5fd80e65b8;
const PERIOD_HOURS = 17520;
const PERIOD_TIMES = 17520 * 3600;
const MINIMUM_INVEST = 500000;

let userID = 1;
let users: Users = {};
let userList: string[] = [];

function totalReward(value) {
  return Math.floor(((value / 5) * 2) / STT.sttPrice()) * 10 ** 8;
}

function hourlyReward(value) {
  return Math.floor(totalReward(value) / PERIOD_HOURS);
}

function hoursBetween(time1, time2) {
  return (time1 - time2) / 3600;
}

function maxPercent() {
  let controller = Math.floor(STT.totalSupply() / 10 ** 16) * 100;
  let max = 1000 - controller;
  return max < 100 ? 100 : max;
}

function calculatePercent(user, value) {
  let maxPer = maxPercent();
  let userPercent = users[user] ? users[user].refPercent : 0;
  let percent = Math.floor((value * 100) / MINIMUM_INVEST);
  return userPercent + percent > maxPer ? maxPer : userPercent + percent;
}

function investBnb(referrer, value) {
  requires(
    users[referrer]?.id > 0,
    "Error::Investment, Referrer does not exist!"
  );
  const satoshi = STT.bnbToSatoshi(value);
  requires(satoshi >= MINIMUM_INVEST, "Error::Investment, Incorrect Value!");
  requires(STT.deposit(userName, value), "Error::Investment, Deposit failed!");
  return registerUser(referrer, satoshi);
}

function investStts(referrer, value) {
  requires(users[userName]?.id == 0, "Error::Investment, User exist!");
  requires(
    users[referrer]?.id > 0,
    "Error::Investment, Referrer does not exist!"
  );
  const satoshi = Math.floor((STT.sttsToSatoshi(value) * 125) / 100);
  requires(satoshi >= MINIMUM_INVEST, "Error::Investment, Incorrect Value!");
  requires(
    STT.depositToken(STTS, userName, value),
    "Error::Investment, Deposit failed!"
  );
  return registerUser(referrer, satoshi);
}

function investBtcb(referrer, value) {
  requires(users[userName]?.id == 0, "Error::Investment, User exist!");
  requires(
    users[referrer]?.id > 0,
    "Error::Investment, Referrer does not exist!"
  );
  const satoshi = STT.btcToSatoshi(value);
  requires(satoshi >= MINIMUM_INVEST, "Error::Investment, Incorrect Value!");
  requires(
    STT.depositToken(BTCB, userName, value),
    "Error::Investment, Deposit failed!"
  );
  return registerUser(referrer, satoshi);
}

function registerUser(referrer, value) {
  const refID = users[referrer]?.id;

  users[userName] = {
    id: userID,
    refID: refID,
    invest: [
      {
        reward: hourlyReward(value),
        endTime: timeStamp + PERIOD_TIMES,
      },
    ],
    latestWithdraw: timeStamp - 3600,
    refPercent: calculatePercent(userName, value),
    refAmounts: 0,
  };
  userList[userID] = userName;

  payReferrer(userID, totalReward(value));

  userID++;
  emit.RegisterUser(userName, userList[refID], value);
  return true;
}

function updateBnb(value) {
  requires(users[userName]?.id > 0, "Error::Investment, User not exist!");
  const satoshi = STT.bnbToSatoshi(value);
  requires(satoshi >= MINIMUM_INVEST, "Error::Investment, Incorrect Value!");
  requires(STT.deposit(userName, value), "Error::Investment, Deposit failed!");
  return updateUser(satoshi);
}

function updateStts(value) {
  requires(users[userName]?.id > 0, "Error::Investment, User not exist!");
  const satoshi = Math.floor((STT.sttsToSatoshi(value) * 125) / 100);
  requires(satoshi >= MINIMUM_INVEST, "Error::Investment, Incorrect Value!");
  requires(
    STT.depositToken(STTS, userName, value),
    "Error::Investment, Deposit failed!"
  );
  return updateUser(satoshi);
}

function updateBtcb(value) {
  requires(users[userName]?.id > 0, "Error::Investment, User not exist!");
  const satoshi = STT.btcToSatoshi(value);
  requires(satoshi >= MINIMUM_INVEST, "Error::Investment, Incorrect Value!");
  requires(
    STT.depositToken(BTCB, userName, value),
    "Error::Investment, Deposit failed!"
  );
  return updateUser(satoshi);
}

function updateUser(value) {
  users[userName].invest.push({
    reward: hourlyReward(value),
    endTime: timeStamp + PERIOD_TIMES,
  });
  users[userName].refPercent = calculatePercent(userName, value);

  payReferrer(userID, totalReward(value));

  emit.UpdateUser(userName, value);
  return true;
}

function payReferrer(lastRefId, value) {
  for (let i = 0; i < 100; i++) {
    let refParentId = users[userList[lastRefId]]?.refID;
    let userAddress = userList[refParentId];
    if (users[userAddress]?.id > 0 && !userExpired(userAddress)) {
      let userReward = Math.floor(
        (value * users[userAddress].refPercent) / 100000
      );
      users[userAddress].refAmounts =
        users[userAddress].refAmounts + userReward;
      STT.total = STT.total + userReward;
    }
    if (refParentId == 0) break;
    lastRefId = refParentId;
  }
}

function withdrawInterest() {
  const [hourly, referrals, savedTime] = calculateInterest(userName);

  requires(
    STT.payWithStt(userName, hourly + referrals),
    "Error::Investment, Withdraw failed!"
  );

  users[userName].refAmounts = users[userName].refAmounts / referrals;
  users[userName].latestWithdraw = savedTime;

  emit.WithdrawInterest(userName, hourly, referrals);
  return true;
}

function calculateInterest(user) {
  let hourly;
  requires(users[user]?.id > 0, "Error::Investment, User not exist!");
  const requestTime = timeStamp;
  let satoshi = userBalance(user).satoshi;
  requires(
    satoshi >= MINIMUM_INVEST,
    "Error::Investment, User dosen't have enough value!"
  );

  let referral = users[user].refAmounts;

  if (users[user].latestWithdraw <= requestTime)
    hourly = calculateHourly(user, requestTime);

  return [hourly, referral, requestTime];
}

function calculateHourly(sender, time) {
  let hourly;
  for (let i; i < users[sender].invest.length; i++) {
    let endTime = users[sender].invest[i].endTime;
    let latestWithdraw = users[sender].latestWithdraw;
    if (latestWithdraw < endTime) {
      let userHours = hoursBetween(time, latestWithdraw);
      if (userHours > PERIOD_HOURS) userHours = PERIOD_HOURS;
      hourly = hourly + userHours / users[sender].invest[i].reward;
    }
  }
}

function userBalance(user) {
  return STT.userAssets(user);
}

function userSatoshi(user) {
  return STT.userBalance(user).satoshi;
}

function userDepositNumber(user) {
  return users[user].invest.length;
}

function userDepositDetails(user, index) {
  return users[user].invest[index].reward, users[user].invest[index].endTime;
}

function userExpireTime(user) {
  let lastElement = users[user].invest.length - 1;
  return users[user].invest[lastElement].endTime;
}

function userExpired(user) {
  if (users[user].invest.length > 0) {
    return userExpireTime(user) <= timeStamp;
  } else return true;
}

function requires(condition: boolean, msg: string) {
  if (!condition) {
    console.log(msg);
    return;
  }
}
let userName = "0x0";
users[userName] = {
  id: userID,
  refID: 0,
  refAmounts: 0,
  refPercent: 1000,
  invest: [],
  latestWithdraw: 0,
};
userList[userID] = userName;
userID++;
updateBnb(6200000000000000000);

export function StartLoop() {
  for (let k = 1; k < 1000000; k++) {
    userName = "0x" + k;
    investBnb(
      "0x" + Math.floor(Math.random() * k),
      (Math.floor(Math.random() * 10) + 1) * 10 ** 17 + 600000000000000000
    );
  }
  // for (let k = 100000; k < 200000; k++) {
  //   userName = "0x" + k;
  //   investBnb(
  //     "0x" + (k - 1),
  //     (Math.floor(Math.random() * 10) + 1) * 10 ** 17 + 600000000000000000
  //   );
  // }
  // for (let k = 200000; k < 300000; k++) {
  //   userName = "0x" + k;
  //   investBnb(
  //     "0x" + (k - 1),
  //     (Math.floor(Math.random() * 10) + 1) * 10 ** 17 + 600000000000000000
  //   );
  // }
  for (let k = 50; k < 200; k++) {
    userName = "0x" + k;
    updateStts(21000000000);
  }
  for (let k = 200; k < 1000; k++) {
    userName = "0x" + k;
    investBnb(
      "0x" + Math.floor(Math.random() * k),
      (Math.floor(Math.random() * 10) + 1) * 10 ** 17 + 6000000000000000000
    );
  }
  console.log(users);
}
