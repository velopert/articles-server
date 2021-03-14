const { sanitizeEntity } = require('strapi-utils');

module.exports = {
  async create(ctx) {
    // 사용자의 id를 데이터에 추가
    ctx.request.body.user = ctx.state.user.id;
    const { articleId } = ctx.params;
    ctx.request.body.article = articleId;

    // 게시글 존재 유무 확인
    const article = await strapi.services.article.findOne({ id: articleId }); // id 로 데이터 조회
    if (!article) {
      ctx.throw(404);
    }

    // Comment 데이터 생성
    const entity = await strapi.services.comment.create(ctx.request.body);
    // 응답 반환
    return sanitizeEntity(entity, { model: strapi.models.comment });
  },
  async find(ctx) {
    // articleId 로 댓글 조회
    const entities = await strapi.services.comment.find({
      article: ctx.params.articleId,
    });
    // 각 데이터들에 대하여 sanitizeEntity를 처리하여 응답 반환
    return entities.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models.comment })
    );
  },
  async update(ctx) {
    const { articleId, id } = ctx.params; // URL 파라미터 추출
    // 댓글 조회
    const comment = await strapi.services.comment.findOne({
      id,
      article: articleId,
    });
    // 데이터가 존재하지 않을 때
    if (!comment) {
      return ctx.throw(404);
    }
    // article 또는 user 변경 막기
    if (ctx.request.body.article || ctx.request.body.user) {
      return ctx.throw(400, 'article or user field cannot be changed');
    }
    // 사용자 확인
    if (ctx.state.user.id !== comment.user.id) {
      return ctx.unauthorized(`You can't update this entry`);
    }
    // comment 데이터 업데이트
    const entity = await strapi.services.comment.update(
      {
        id,
      },
      ctx.request.body
    );
    // 응답 반환
    return sanitizeEntity(entity, { model: strapi.models.comment });
  },
  async delete(ctx) {
    const { articleId, id } = ctx.params; // URL 파라미터 추출
    // 댓글 조회
    const comment = await strapi.services.comment.findOne({
      id,
      article: articleId,
    });
    // 데이터가 존재하지 않을 때
    if (!comment) {
      return ctx.throw(404);
    }

    // 사용자 확인
    if (ctx.state.user.id !== comment.user.id) {
      return ctx.unauthorized(`You can't remove this entry`);
    }

    // 데이터 삭제
    await strapi.services.comment.delete({ id });

    ctx.status = 204;
  },
};
