import { LiferayService } from "@server/services/liferay";
import { Get, JsonController, Param, Post, Put, Delete, BodyParam, Res } from "routing-controllers";
import { Response } from 'express';

/**
 * Handles all the incoming requests related to the integration with Liferay.
 */
@JsonController('/:lang/liferay')
export class LiferayController {

    /**
     * Handles the requests demanding a specific article from Liferay, identified by its language and external content key.
     * @param lang Language in which the request is performed.
     * @param contentKey External Content Key that identifies the article that should be returned.
     * @returns The response or error returned by Liferay. In case of success: the data linked to the requested Liferay article.
     */
    @Get('/content/:key')
    async getArticle(@Param('lang') lang: string, @Param('key') contentKey: string, @Res() res: Response) {
      let _ret = await LiferayService.getArticle(lang, contentKey);

      if (_ret == '') {
        res.status(204).send();
        return;
      }
      res.status(200).send(_ret);
    }

    /**
     * Handles the requests to post a new article on Liferay.
     * @param lang Language in which the request is performed.
     * @param contentKey External Content Key which will be used as an identifier for this new article.
     * @param contentType Content type for the article.
     * @param content Article's content.
     * @returns The response or error returned by Liferay. In case of success: internal liferay id for the newly created article.
     */
    @Post('/content/:key')
    async postArticle(@Param('lang') lang: string, @Param('key') contentKey: string, @BodyParam("type") contentType: string, @BodyParam("data") content: string) {
      return await LiferayService.postArticle(lang, contentKey, contentType, content);
    }
  
    /**
     * Handles the requests to update an existing article on Liferay.
     * @param lang Language in which the request is performed.
     * @param contentKey External Content Key that identifies for the article expected to be updated.
     * @param contentType Content type for the article.
     * @param content Article's updated content.
     * @returns The response or error returned by Liferay. In case of success: internal liferay id for the recently updated article.
     */
    @Put('/content/:key')
    async putArticle(@Param('lang') lang: string, @Param('key') contentKey: string, @BodyParam("type") contentType: string, @BodyParam("data") content: string) {
      return await LiferayService.putArticle(lang, contentKey, contentType, content);
    }

    /**
     * Handles the requests to delete an existing article on Liferay.
     * @param _lang Language in which the request is performed.
     * @param contentKey External Content Key that identifies for the article expected to be deleted.
     * @returns The response or error returned by Liferay. In case of success: 200 OK.
     */
    @Delete('/content/:key')
    async deleteArticle(@Param('lang') _lang: string, @Param('key') contentKey: string) {
      return await LiferayService.deleteArticle(contentKey);
    }
}