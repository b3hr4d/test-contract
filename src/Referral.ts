type UserStruct = {
  id: number;
  time: number;
  isExist: boolean;
  referralId: number;
  referral: string[];
  levelStat: number[];
};
type Users = {
  [key: string]: UserStruct;
};

class Referral {
  REFERRER_1_LEVEL_LIMIT = 3;
  PERIOD_LENGTH = 37 * 360000;

  users: Users = {};

  userList: {
    [key: number]: string;
  } = {};

  userRefComplete: {
    [key: number]: boolean;
  } = {};

  profitStat: {
    [key: string]: number;
  } = {};

  levelStat: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  currUserID = 0;
  refCompleteDepth = 0;
  constructor() {
    this.registerUser(0);
  }

  registerUser(_referrerID: number) {
    this.currUserID++;
    this.users[msgSender()] = {
      isExist: true,
      id: this.currUserID,
      referralId: _referrerID,
      referral: [],
      time: Date.now(),
      levelStat: [],
    };
    this.userList[this.currUserID] = msgSender();
    if (this.userList[_referrerID])
      this.users[this.userList[_referrerID]]?.referral.push(msgSender());

    let lastRefParent = _referrerID;
    for (let i = 1; i < 15; i++) {
      const refParent = this.users[this.userList[lastRefParent]].referralId;
      if (refParent != lastRefParent) {
        this.users[this.userList[refParent]].levelStat[i] += 1;
        lastRefParent = refParent;
      }
      if (lastRefParent == 0) break;
    }
  }

  regUser(_referrer: string) {
    requires(!this.users[msgSender()]?.isExist, "Error::Refferal, User exist");
    requires(
      totalSttSupply() < 100000000000,
      "Error::Refferal, New user could not be added with this way anymore."
    );

    let _referrerID;

    if (this.users[_referrer]?.isExist) {
      _referrerID = this.users[_referrer].id;
    } else if (_referrer == "") {
      _referrerID = this.findFirstFreeReferrer();
      this.refCompleteDepth = _referrerID;
    } else {
      return "Error::Refferal, Incorrect referrer";
    }

    requires(
      _referrerID > 0 && _referrerID <= this.currUserID,
      "Error::Refferal, Incorrect referrer Id"
    );

    requires(
      msgValue() == currentLevelPrice(),
      "Error::Refferal, Incorrect Value"
    );

    if (
      this.users[this.userList[_referrerID]]?.referral.length >=
      this.REFERRER_1_LEVEL_LIMIT
    ) {
      _referrerID = this.users[
        this.findFreeReferrer(this.userList[_referrerID])
      ].id;
    }

    this.registerUser(_referrerID);

    if (this.users[this.userList[_referrerID]]?.referral.length == 3) {
      this.userRefComplete[_referrerID] = true;
    }

    this.payForLevel(1, msgSender());

    regLevelEvent(msgSender(), this.userList[_referrerID], Date.now());
  }

  withdrawIntrest(_reciever: string) {
    //31668017 - interest(10% APY) per second for min. deposit amount (0.01 ETH), cuz:
    //1e15(10% of 0.01 ETH) / 31577600 (seconds in 365.25 days)
    let depositTime = this.users[msgSender()].time;
    //(etherBalance[msgSender()] / 1e16) - calc. how much higher interest will be (based on deposit), e.g.:
    //for min. deposit (0.01 ETH), (etherBalance[msgSender()] / 1e16) = 1 (the same, 31668017/s)
    //for deposit 0.02 ETH, (etherBalance[msgSender()] / 1e16) = 2 (doubled, (2*31668017)/s)
    let interestPerSecond = 31668017 * (currentLevelPrice() / 1e16);
    let interest = interestPerSecond * depositTime;
    withdrawStt(_reciever, interest);
  }

  buyLevel(_level: number) {
    requires(
      this.users[msgSender()].isExist,
      "Error::Refferal, User not exist"
    );

    requires(
      currentLevelPrice() * 700 <= 10,
      "Error::Refferal, Incorrect level"
    );

    if (_level == 1) {
      requires(
        msgValue() == currentLevelPrice(),
        "Error::Refferal, Incorrect Value"
      );
      this.users[msgSender()].time += this.PERIOD_LENGTH;
    } else {
      requires(
        msgValue() == currentLevelPrice(),
        "Error::Refferal, Incorrect Value"
      );

      for (let l = _level - 1; l > 0; l--) {
        requires(
          this.users[msgSender()].time >= Date.now(),
          "Error::Refferal, Buy the previous level"
        );
      }

      if (this.users[msgSender()].time == 0) {
        this.users[msgSender()].time = Date.now() + this.PERIOD_LENGTH;
      } else {
        this.users[msgSender()].time += this.PERIOD_LENGTH;
      }
    }
    this.payForLevel(_level, msgSender());
    buyLevelEvent(msgSender(), _level, Date.now());
  }

  payForLevel(_level: number, _user: string) {
    let referer;
    let referer1;
    let referer2;
    let referer3;
    if (_level == 1 || _level == 5) {
      referer = this.userList[this.users[_user].referralId];
    } else if (_level == 2 || _level == 6) {
      referer1 = this.userList[this.users[_user].referralId];
      referer = this.userList[this.users[referer1].referralId];
    } else if (_level == 3 || _level == 7) {
      referer1 = this.userList[this.users[_user].referralId];
      referer2 = this.userList[this.users[referer1].referralId];
      referer = this.userList[this.users[referer2].referralId];
    } else if (_level == 4 || _level == 8) {
      referer1 = this.userList[this.users[_user].referralId];
      referer2 = this.userList[this.users[referer1].referralId];
      referer3 = this.userList[this.users[referer2].referralId];
      referer = this.userList[this.users[referer3].referralId];
    }

    if (!this.users[referer]?.isExist) {
      referer = this.userList[1];
    }

    if (this.users[referer].time + this.PERIOD_LENGTH >= Date.now()) {
      if (referer == this.userList[1]) {
        depositTrx(_user, currentLevelPrice());
      } else {
        depositTrx(_user, currentLevelPrice());
        this.profitStat[referer] += currentLevelPrice();
      }
      this.levelStat[_level - 1]++;
      getMoneyForLevelEvent(referer, msgSender(), _level, Date.now());
    } else {
      lostMoneyForLevelEvent(referer, msgSender(), _level, Date.now());
      this.payForLevel(_level, referer);
    }
  }

  getRefDepth() {
    return this.refCompleteDepth;
  }

  findFreeReferrer(_user: string) {
    if (this.users[_user].referral.length < this.REFERRER_1_LEVEL_LIMIT) {
      return _user;
    }

    let referrals = new Array(363);
    referrals[0] = this.users[_user].referral[0];
    referrals[1] = this.users[_user].referral[1];
    referrals[2] = this.users[_user].referral[2];

    let freeReferrer;
    let noFreeReferrer = true;

    for (let i = 0; i < 363; i++) {
      if (
        this.users[referrals[i]].referral.length == this.REFERRER_1_LEVEL_LIMIT
      ) {
        if (i < 120) {
          referrals[(i + 1) * 3] = this.users[referrals[i]].referral[0];
          referrals[(i + 1) * 3 + 1] = this.users[referrals[i]].referral[1];
          referrals[(i + 1) * 3 + 2] = this.users[referrals[i]].referral[2];
        }
      } else {
        noFreeReferrer = false;
        freeReferrer = referrals[i];
        break;
      }
    }
    if (noFreeReferrer) {
      freeReferrer = this.userList[this.findFirstFreeReferrer()];
      requires(freeReferrer != "", "ane?");
    }
    return freeReferrer;
  }

  findFirstFreeReferrer() {
    let free;
    for (let i = this.refCompleteDepth; i < 500 + this.refCompleteDepth; i++) {
      if (!this.userRefComplete[i]) {
        free = i;
      }
    }
    return free;
  }

  viewUserReferral(_user: string) {
    return this.users[_user].referral;
  }

  viewUserLevelExpired(_user: string) {
    for (let i = 0; i < 8; i++) {
      if (Date.now() < this.users[_user].time) {
        return this.users[_user].time - Date.now();
      }
    }
  }
}

function msgSender(): string {
  return "0x" + id;
}
function msgValue(): number {
  return 700;
}
function requires(condition: boolean, msg: string) {
  if (!condition) {
    console.log(msg);
    return;
  }
}
function currentLevelPrice() {
  return 700;
}

function totalSttSupply() {
  return 1000000;
}
function regLevelEvent(arg0: string, arg1: string, arg2: number) {
  //   console.log("Function not implemented.");
}

function buyLevelEvent(arg0: string, _level: any, arg2: number) {
  //   console.log("Function not implemented.");
}

function getMoneyForLevelEvent(
  referer: any,
  arg1: string,
  _level: number,
  arg3: number
) {
  //   console.log("Function not implemented.");
}

function lostMoneyForLevelEvent(
  referer: any,
  arg1: string,
  _level: number,
  arg3: number
) {
  //   console.log("Function not implemented.");
}

function withdrawStt(_reciever: string, interest: number) {
  //   console.log("Function not implemented.");
}

function depositTrx(_user: string, arg2: number) {
  //   console.log("Function not implemented.");
}

let id = 0;
let ref = new Referral();
export function StartLoop() {
  for (let k = 1; k < 200; k++) {
    // if (k > 100) {
    //   currentLevel = 2;
    //   if (k > 150) currentLevel = 4;
    //   regUser(
    //     `0x${Math.floor(Math.random() * 50)}`,
    //     `0x${k}`,
    //     currentLevelPrice()
    //   );
    // } else
    id = k;
    ref.regUser("0x0");
  }

  console.log(ref.users);

  for (let m = 2000; m < 4000; m++) {
    // if (m > 100) {
    //   currentLevel = 2;
    //   if (m > 150) currentLevel = 4;
    //   regUser(
    //     `0x${Math.floor(Math.random() * 50)}`,
    //     `0x${m}`,
    //     currentLevelPrice()
    //   );
    // } else
    id = m;
    ref.regUser("0x0");
  }
}
