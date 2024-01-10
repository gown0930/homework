// 블랙리스트를 저장할 배열
const tokenBlacklist = [];

// 토큰을 블랙리스트에 추가하는 함수
const addToBlacklist = (token) => {
   tokenBlacklist.push(token);
};

// 토큰이 블랙리스트에 있는지 확인하는 함수
const isBlacklisted = (token) => {
   return tokenBlacklist.includes(token);
};

module.exports = { addToBlacklist, isBlacklisted };
