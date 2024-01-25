const { queryDatabase } = require("../modules/connection");
const redis = require("redis").createClient();

const uploadCountToPostgres = async () => {
   try {
      await redis.connect();

      // 현재 접속 중인 사용자 수 가져오기
      const count = await redis.SCARD(`countLogin`);

      // PostgreSQL에 삽입할 쿼리 작성
      const insertQuery = `
      INSERT INTO homework.count (count)
      VALUES ($1)
    `;

      // PostgreSQL에 삽입
      await queryDatabase(insertQuery, [count]);
      // 동시 사용자 수를 0으로 초기화
      await redis.DEL(`countLogin`);

      console.log(`PostgreSQL에 사용자 업로드 완료: ${count}`);
   } catch (error) {
      console.error('에러:', error);
   } finally {
      redis.disconnect();
   }
};

module.exports = { uploadCountToPostgres };