import { Param, Get, Put, Body, QueryParam, JsonController } from 'routing-controllers';

import { CategoryService } from '@server/services/category';

/**
 * Controller that will handle all incoming requests related to the Map Entity.
 */
@JsonController('/:lang/category')
export class CategoryController {
  /**
   * Handles the incoming requests that demand the category list.
   * @param lang Language in which the query should be done.
   * @returns An array of categories including id, name, tipology, description and external key.
   */
  @Get('/')
  async getCategories(@Param('lang') lang: string) {
    return await CategoryService.getCategories(lang);
  }

  /**
   * Handles the incoming requests that expect a category, specified by its id and its tipology name.
   * @param lang Language in which the query should be done.
   * @param id Id of the category that should be returned.
   * @param tipology Tipology Id the category is related with.
   * @returns A Category object with a matching id and tipology.
   */
  @Get('/:id')
  async getCategoryById(@Param('lang') lang: string, @Param('id') id: string, @QueryParam("tipology") tipology: string) {
    return await CategoryService.getCategoryByIdAndTipologyId(lang, id, tipology);
  }


  /**
   * Handles the incoming requests to modify the description and the content external key of a given category.
   * @param lang Language in which the query should be performed.
   * @param id Id of the category to be modified.
   * @param tipology Tipology id that the category is related with.
   * @param requestBody Request Body including descripcion (description text) and clave_externa_contenido (id).
   * @returns 
   */
  @Put('/:id')
  async putCategory(@Param('lang') lang: string, @Param('id') id: string, @QueryParam("tipology") tipology: string, @Body() requestBody: any) {
    return await CategoryService.putCategoryByIdAndTipology(lang, id, tipology, requestBody);
  }
}