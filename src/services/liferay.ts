import ApplicationError from '@server/models/application_error';
import axios from 'axios';
import qs from 'qs'
import moment from 'moment';

/**
 * Implements all the requests to consume Liferay's contents.
 */
export class LiferayService {

    private static liferayToken = null as string;
    private static tokenExpiry = null as Date;
    private static alreadyForced = false;

    /**
     * Performs the needed calls in order to obtain a valid Liferay token.
     * @param force Rewrite existing token even if it is presumibly still valid.
     * @returns Current valid liferay token.
     */
    private static before = async (force: boolean): Promise<string> => {
        let now = new Date();
        if (force) this.alreadyForced = true;

        // If we have no token or it is expired or we force the renewal of said token
        if (force || this.liferayToken == null || this.tokenExpiry == null || now > this.tokenExpiry) {
            console.log(`    [BEFORE] Performing (POST) ${process.env.LIFERAY_TOKEN_URL}`)

            try {
                let _ret = await axios.post(`${process.env.LIFERAY_TOKEN_URL}`, 
                    qs.stringify({
                        grant_type: 'client_credentials',
                        client_id: `${process.env.LIFERAY_CLIENT_ID}`,
                        client_secret: `${process.env.LIFERAY_CLIENT_SECRET}`
                    }),
                    {
                        headers: {
                            'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
                        }
                    }
                )
                
                if (_ret.data.access_token) {
                    this.liferayToken = _ret.data.access_token
                    this.tokenExpiry = moment(now).add(6, 'm').toDate();
                    return this.liferayToken;
                }
                this.alreadyForced = false;
                throw new ApplicationError(403, 79403, `Unauthorized connection to Liferay.`, `No s'ha pogut autoritzar la connexió amb Liferay.`)
            } catch (error : any) {
                console.error(error)
                if (error.response.status === 503) {
                    this.alreadyForced = false;
                    throw new ApplicationError(503, 79503, `Liferay service unavailable`, `No s'ha pogut conectar amb Liferay.`)    
                } else {
                    this.alreadyForced = false;
                    console.error(error)
                    throw error;    
                }
            }
        } else {
            return this.liferayToken;
        }
    }

    /**
     * Gets an article stored in Liferay, identified by its external key and language.
     * @param lang Language the query should be performed in.
     * @param contentKey Key of the content that should be fetched.
     */
    public static getArticle = async (lang: string, contentKey: string): Promise<any> => {
        console.log(`    Performing (GET) ${process.env.LIFERAY_BASE_URL}/journalPDU/${lang}/${contentKey}`)

        try {
            await this.before(false);
            let _ret = await axios.get(`${process.env.LIFERAY_BASE_URL}/journalPDU/${lang}/${contentKey}`, { headers: {'Authorization': `Bearer ${this.liferayToken}`}});
            console.log(`    Liferay response: ${JSON.stringify(_ret.data)}`)
            this.alreadyForced = false;
            return _ret.data;
        } catch (error : any) {
            console.error(error)
            if (error.response.status === 403) {
                if (this.alreadyForced) {
                    this.alreadyForced = false;
                    throw new ApplicationError(403, 70403, `Unauthorized connections to Liferay. Several attempts made.`, `No s'ha pogut autoritzar la connexió amb Liferay.`)
                } else {
                    // Force before and try again
                    await this.before(true);
                    await this.getArticle(lang, contentKey);
                }
            } else if (error.response.status === 404) {
                this.alreadyForced = false;
                // TODO delete this error:
                throw new ApplicationError(404, 70404, `Article with contentKey ${contentKey} (lang: ${lang}) not found in Liferay`, `No s'ha pogut trobar l'article amb clau ${contentKey}`)
                console.log(`    Article with contentKey ${contentKey} (lang: ${lang}) not found in Liferay.`)
                return '';
            } else if (error.response.status === 500) {
                this.alreadyForced = false;
                throw new ApplicationError(500, 70500, `Liferay internal error with status '${error.response.statusText}' and following data: '${error.response.data}'`, `Hi ha hagut un error inesperat a la connexió amb Liferay.`)
            } else {
                this.alreadyForced = false;
                console.error(error)
                throw error;
            }
        }
    }

    /**
     * Posts an image on Liferay, identified by an external Id, an extension and its content in base64.s
     * @param contentKey Key of the content to which the image is related.
     * @param extension Image extension (e.g. "jpeg").
     * @param imgBase64 Image file content in base64.
     */
    public static postImage = async (contentKey: string, extension: string, imgBase64: string) : Promise<any> => {
        console.log(`    Performing (POST) ${process.env.LIFERAY_BASE_URL}/imageFilePDU`)
        
        try {
            await this.before(false);
            let _ret = await axios.post(`${process.env.LIFERAY_BASE_URL}/imageFilePDU/`, {
                idExterno: contentKey,
                extension: extension,
                file: imgBase64
            },
            { headers: {'Authorization': `Bearer ${this.liferayToken}`,
            'content-type': 'application/json;charset=utf-8',
            'Accept': 'application/json'}})
            
            if (_ret.status === 200) {
                this.alreadyForced = false;
                console.log(`    Liferay response: ${JSON.stringify(_ret.data)}`)
                return _ret.data;    
            }
        } catch (error : any) {
            if (error.response.status === 403) {
                if (this.alreadyForced) {
                    this.alreadyForced = false;
                    throw new ApplicationError(403, 72403, `Unauthorized connections to Liferay. Several attempts made.`, `No s'ha pogut autoritzar la connexió amb Liferay.`)
                } else {
                    // Force before and try again
                    await this.before(true);
                    await this.postImage(contentKey, extension, imgBase64);
                }
            } else if (error.response.status === 409) {
                this.alreadyForced = false;
                throw new ApplicationError(500, 72409, `Internal Liferay conflict. Attempt to create image with contentKey '${contentKey}' and extension '${extension}' generated the following status '${error.response.statusText}' with this data: '${error.response.data}'`, 
                                            `S'ha trobat un conflicte de noms al crear la nova imatge a Liferay`);
            } else if (error.response.status === 500) {
                this.alreadyForced = false;
                throw new ApplicationError(500, 72500, `Liferay internal error with status '${error.response.statusText}' and following data: '${error.response.data}'`, `Hi ha hagut un error inesperat a la connexió amb Liferay.`)
            } else {
                this.alreadyForced = false;
                console.error(error)
                throw error;
            }
        }

        // If reached, _ret was not an error and has status 204.
        throw new ApplicationError(400, 72204, `Missing parameters. Parameters needed: contentKey (url), extension (body), data (body).`, `És necessari incloure tots els següents camps per pujar una nova imatge a Liferay: lang, contentKey, extension, data.`)
    }


    /**
     * Posts a new article in a specific language on Liferay, identified by an external id, a content type and its content.
     * @param lang Language in which the article is added.
     * @param contentKey Key of the content that will be used as identifier in the postgres db.
     * @param contentType Identifies the type of content for the variable 'content'.
     * @param content Content of the article
     * @returns Liferay's response.
     */
    public static postArticle = async (lang: string, contentKey: string, contentType: string, content: string) : Promise<any> => {
        console.log(`    Performing (POST) ${process.env.LIFERAY_BASE_URL}/journalPDU`)

        try {
            await this.before(false);

            let _ret = await axios.post(`${process.env.LIFERAY_BASE_URL}/journalPDU`, {
                    idExterno: contentKey,
                    contenidoHTML: content,
                    tipoContenido: contentType,
                    idioma: lang
                },
                { 
                    headers: {
                        'Authorization': `Bearer ${this.liferayToken}`,
                        'content-type': 'application/json;charset=utf-8',
                        'Accept': 'application/json'
                    }
                }
            )
            console

            if (_ret.status === 200) {
                console.log(`    Liferay response: ${JSON.stringify(_ret.data)}`);
                this.alreadyForced = false;
                return _ret.data;    
            }
        } catch (error : any) {
            console.error(error)
            if (error.response.status === 403) {
                if (this.alreadyForced) {
                    this.alreadyForced = false;
                    throw new ApplicationError(403, 71403, `Unauthorized connections to Liferay. Several attempts made.`, `No s'ha pogut autoritzar la connexió amb Liferay.`)
                } else {
                    // Force before and try again
                    await this.before(true);
                    await this.postArticle(lang, contentKey, contentType, content);
                }
            } else if (error.response.status === 409) {
                this.alreadyForced = false;
                throw new ApplicationError(500, 71409, `Internal Liferay conflict. Attempt to create article with lang '${lang}', contentKey '${contentKey}' and contentType '${contentType}' generated the following status '${error.response.statusText}' with this data: '${error.response.data}'`, 
                                            `S'ha trobat un conflicte de noms al crear el nou article a Liferay`);
            } else if (error.response.status === 500) {
                this.alreadyForced = false;
                throw new ApplicationError(500, 71500, `Liferay internal error with status '${error.response.statusText}' and following data: '${error.response.data}'`, `Hi ha hagut un error inesperat a la connexió amb Liferay.`)
            } else {
                this.alreadyForced = false;
                console.error(error)
                throw error;
            }
        }

        // If reached, _ret was not an error and has status 204.
        throw new ApplicationError(400, 71204, `Missing parameters. Parameters needed: lang (url), contentKey (url), contentType (body), content (body).`, `És necessari incloure tots els següents camps per pujar un nou article a Liferay: lang, contentKey, type, data.`)
    }


    /**
     * Updates an existing article in a specific language on Liferay, identified its external content key.
     * @param lang Language in which the article is added.
     * @param contentKey Key of the content that identifies the article that should be update.
     * @param contentType Identifies the type of content for the variable 'content'.
     * @param content Updated content of the article.
     * @returns Liferay's response.
     */
    public static putArticle = async (lang: string, contentKey: string, contentType: string, content: string) : Promise<any> => {
        console.log(`    Performing (PUT) ${process.env.LIFERAY_BASE_URL}/journalPDU`)

        try {
            await this.before(false);
            let _ret = await axios.put(`${process.env.LIFERAY_BASE_URL}/journalPDU`, {
                idExterno: contentKey,
                contenidoHTML: content,
                tipoContenido: contentType,
                idioma: lang
            },
            { headers: {'Authorization': `Bearer ${this.liferayToken}`}})

            if (_ret.status === 200) {
                console.log(`    Liferay response: ${JSON.stringify(_ret.data)}`)
                this.alreadyForced = false;
                return _ret.data;    
            }
        } catch (error : any) {
            if (error.response.status === 403) {
                if (this.alreadyForced) {
                    this.alreadyForced = false;
                    throw new ApplicationError(403, 73403, `Unauthorized connections to Liferay. Several attempts made.`, `No s'ha pogut autoritzar la connexió amb Liferay.`)
                } else {
                    // Force before and try again
                    await this.before(true);
                    await this.putArticle(lang, contentKey, contentType, content);
                }
            } else if (error.response.status === 404) {
                this.alreadyForced = false;
                throw new ApplicationError(404, 73404, `Liferay article not found: ${contentKey}'`, `No s'ha pogut actualitzar l'article ${contentKey} ja que no s'ha trobat.`)
            } else if (error.response.status === 500) {
                this.alreadyForced = false;
                throw new ApplicationError(500, 73500, `Liferay internal error with status '${error.response.statusText}' and following data: '${error.response.data}'`, `Hi ha hagut un error inesperat a la connexió amb Liferay.`)
            } else {
                this.alreadyForced = false;
                console.error(error)
                throw error;
            }
        }

        // If reached, _ret was not an error and has status 204.
        throw new ApplicationError(400, 73204, `Missing parameters. Parameters needed: lang (url), contentKey (url), contentType (body), content (body).`, `És necessari incloure tots els següents camps per actualitzar un article a Liferay: lang, contentKey, type, data.`)
    }


    /**
     * Deletes an existing article on Liferay, identified its external content key, along with all the related images and documents.
     * @param contentKey Key of the content that identifies the article that should be deleted.
     * @returns Liferay's response.
     */
    public static deleteArticle = async (contentKey: string) : Promise<any> => {
        console.log(`    Performing (DELETE) ${process.env.LIFERAY_BASE_URL}/journalPDU/${contentKey}`)

        try {
            await this.before(false);
            let _ret = await axios.delete(`${process.env.LIFERAY_BASE_URL}/journalPDU/${contentKey}`, { headers: {'Authorization': `Bearer ${this.liferayToken}`}})

            if (_ret.status === 200) {
                console.log(`    Liferay response: ${JSON.stringify(_ret.data)}`)
                this.alreadyForced = false;
                return _ret.data;    
            }
        } catch (error : any) {
            if (error.response.status === 403) {
                if (this.alreadyForced) {
                    this.alreadyForced = false;
                    throw new ApplicationError(403, 74403, `Unauthorized connections to Liferay. Several attempts made.`, `No s'ha pogut autoritzar la connexió amb Liferay.`)
                } else {
                    // Force before and try again
                    await this.before(true);
                    await this.deleteArticle(contentKey);
                }
            } else if (error.response.status === 500) {
                this.alreadyForced = false;
                throw new ApplicationError(500, 74500, `Liferay internal error with status '${error.response.statusText}' and following data: '${error.response.data}'`, `Hi ha hagut un error inesperat a la connexió amb Liferay.`)
            } else if (error.response.status === 404) {
                this.alreadyForced = false;
                throw new ApplicationError(404, 74404, `Article with external key '${contentKey}' not found'`, `No s'ha trobat a Liferay l'article a eliminar amb clau externa de contingut ${contentKey}.`)
            } else {
                this.alreadyForced = false;
                console.error(error)
                throw error;
            }
        }
    }
}
