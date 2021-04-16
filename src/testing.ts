type Address = string;

interface user {
  id: number;
  referralId: number;
  referral: Address[];
  levelStat?: number[];
}

let LEVELS = [3, 9, 27, 81, 243, 729];

let Users: {
  [key: string]: user;
} = {
  "0x0": {
    id: 0,
    referralId: 0,
    referral: ["1x0", "3x0", "2x0"],
    levelStat: [3, 5],
  },
  "1x0": {
    id: 1,
    referralId: 0,
    referral: ["12x0"],
  },
  "2x0": {
    id: 2,
    referralId: 0,
    referral: ["4x0"],
    levelStat: [1, 3, 9, 27, 0, 0],
  },
  "3x0": {
    id: 3,
    referralId: 0,
    referral: ["20x0"],
  },
  "4x0": {
    id: 4,
    referralId: 2,
    referral: ["10x0", "19x0", "22x0"],
    levelStat: [3, 9, 24, 0, 0, 0],
  },
  "10x0": {
    id: 5,
    referralId: 4,
    referral: ["26x0", "29x0", "25x0"],
  },
  "19x0": {
    id: 6,
    referralId: 3,
    referral: ["28x0", "23x0", "21x0"],
  },
  "22x0": {
    id: 7,
    referralId: 4,
    referral: ["38x0", "33x0", "31x0"],
  },
  "26x0": {
    id: 8,
    referralId: 5,
    referral: ["100x0", "101x0", "102x0"],
  },
  "29x0": {
    id: 9,
    referralId: 5,
    referral: ["103x0", "113x0", "123x0"],
  },
  "25x0": {
    id: 10,
    referralId: 5,
    referral: ["104x0", "114x0", "124x0"],
  },
  "28x0": {
    id: 11,
    referralId: 6,
    referral: [], //"105x0", "115x0", "125x0"
  },
  "23x0": {
    id: 12,
    referralId: 6,
    referral: ["106x0", "116x0", "126x0"],
  },
  "21x0": {
    id: 13,
    referralId: 6,
    referral: ["107x0", "117x0", "127x0"],
  },
  "38x0": {
    id: 14,
    referralId: 7,
    referral: ["110x0", "121x0", "132x0"],
  },
  "33x0": {
    id: 15,
    referralId: 7,
    referral: ["111x0", "131x0", "142x0"],
  },
  "31x0": {
    id: 16,
    referralId: 7,
    referral: ["122x0", "151x0", "162x0"],
  },
  "12x0": {
    id: 17,
    referralId: 1,
    referral: [],
  },
  "100x0": {
    id: 18,
    referralId: 1,
    referral: ["89x0"],
  },
  "101x0": {
    id: 19,
    referralId: 1,
    referral: [],
  },
  "102x0": {
    id: 20,
    referralId: 1,
    referral: ["90x0"],
  },
  "103x0": {
    id: 17,
    referralId: 1,
    referral: [],
  },
  "104x0": {
    id: 17,
    referralId: 1,
    referral: [],
  },
  "105x0": {
    id: 17,
    referralId: 1,
    referral: [],
  },
  "106x0": {
    id: 17,
    referralId: 1,
    referral: [],
  },
  "107x0": {
    id: 17,
    referralId: 1,
    referral: [],
  },
  "113x0": {
    id: 17,
    referralId: 1,
    referral: [],
  },
  "114x0": {
    id: 17,
    referralId: 1,
    referral: [],
  },
  "115x0": {
    id: 17,
    referralId: 1,
    referral: [],
  },
  "116x0": {
    id: 17,
    referralId: 1,
    referral: [],
  },
  "117x0": {
    id: 17,
    referralId: 1,
    referral: [],
  },
  "123x0": {
    id: 17,
    referralId: 1,
    referral: [],
  },
  "124x0": {
    id: 17,
    referralId: 1,
    referral: [],
  },
  "125x0": {
    id: 17,
    referralId: 1,
    referral: [],
  },
  "126x0": {
    id: 17,
    referralId: 1,
    referral: [],
  },
  "127x0": {
    id: 17,
    referralId: 1,
    referral: [],
  },
  "110x0": {
    id: 18,
    referralId: 1,
    referral: ["89x0"],
  },
  "121x0": {
    id: 19,
    referralId: 1,
    referral: ["90x0"],
  },
  "132x0": {
    id: 20,
    referralId: 1,
    referral: [],
  },
  "111x0": {
    id: 18,
    referralId: 1,
    referral: ["89x0"],
  },
  "131x0": {
    id: 19,
    referralId: 1,
    referral: ["90x0"],
  },
  "142x0": {
    id: 20,
    referralId: 1,
    referral: ["90x0"],
  },
  "122x0": {
    id: 18,
    referralId: 1,
    referral: ["89x0"],
  },
  "151x0": {
    id: 19,
    referralId: 1,
    referral: ["90x0"],
  },
  "162x0": {
    id: 20,
    referralId: 1,
    referral: ["90x0"],
  },
};

function findMostFree(_user: string): string {
  if (Users[_user].referral.length < 3) return _user;

  console.log(Users[_user]);

  let level = missingLevel(_user);

  console.log("level: ", level);

  let members = totalMembers(_user, level);

  console.log("Members: ", level);

  let referrals = new Array(level * 3);

  referrals[0] = Users[_user].referral[0];
  referrals[1] = Users[_user].referral[1];
  referrals[2] = Users[_user].referral[2];

  for (let i = 0; i < level; i++) {
    for (let m = 0; m < 3; m++) {
      if (Users[referrals[i]]?.referral[m]) {
        referrals[(i + 1) * 3 + m] = Users[referrals[i]].referral[m];
      } else {
        break;
      }
    }
  }

  console.log(referrals);
  let ref: string;
  for (let l = 0; l < 3; l++) {
    console.log("for %s members", l);
    for (let k = 0; k < level; k++) {
      console.log(referrals[k], Users[referrals[k]]?.referral.length);
      if (Users[referrals[k]]?.referral.length == l) {
        ref = referrals[k];
        break;
      }
    }
    if (ref) break;
  }
  return ref;
}

function missingLevel(_user: string) {
  for (let i = 0; i < 6; i++) {
    if (Users[_user].levelStat[i] != LEVELS[i]) {
      return LEVELS[i - 1];
    }
  }
}

function totalMembers(_user: string, _level: number) {
  let members = 0;
  for (let i = 0; i < _level; i++) {
    members = members + Users[_user].levelStat[i];
  }
  return members;
}

console.log(findMostFree("4x0"));
