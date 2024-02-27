//import { LiferayService } from "@server/services/liferay";
import { Controller, Post, Body, UseBefore } from "routing-controllers";
import formData from 'express-form-data';
import { LiferayService } from "@server/services/liferay";

/**
 * Handles all the incoming requests related to the integration with Liferay.
 */
@Controller('/liferay/image')
export class LiferayImageController {
    /**
     * Handles the requests to post an image in Liferay.
     * @param contentKey External Content Key to which the image will be linked.
     * @param extension Extension of the image file.
     * @param imgBase64 Image content in base 64.
     * @returns The response or error returned by Liferay. In case of success: url access to the image.
     */
    @UseBefore(formData.parse())
    @Post()
    async postImage(@Body() imgPayload: any) {
        return await LiferayService.postImage(imgPayload.key, imgPayload.extension, imgPayload.content);
    }
}