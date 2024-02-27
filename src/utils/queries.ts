export const Qry_AllMapsGroupedByTipAndCat = `
        select array_to_json(array_agg(tipologies))
        from (
                select 
                        t.id as idTipologia, 
                        it.texto as textoTipologia, 
                        (
                                select array_to_json(array_agg(categories))
                                from (
                                        select 
                                                c.id as idCategoria, 
                                                ic.texto as textoCategoria,
                                                (
                                                        select array_to_json(array_agg(maps))
                                                        from (
                                                                select 
                                                                        m.id as idMapa, 
                                                                        im.texto as textoMapa, 
                                                                        m."arcgis_mapName" as argisMapName, 
                                                                        m.escala_defecto as escalaDefecto, 
                                                                        m.escala_min as escalaMin, 
                                                                        m.escala_max as escalaMax, 
                                                                        m.id_mapa_base as idMapaBase, 
                                                                        imb.texto as textoMapaBase, 
                                                                        mb.url as urlMapaBase,
                                                                        m."habilitado_SN" as habilitadoSN, 
                                                                        m."descargable_SN" as descargableSN, 
                                                                        m.orden_en_lista as ordenEnLista
                                                                from ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Mapa" m 
                                                                left join ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Idioma" im on m.id = im.id_mapa and im.referencia_atributo = 'nom' and im.id_mapa_base is null and im.id_grupo_capas is null and im.id_tipologia is null and im.id_categoria  is null and im.lang = $1
                                                                left join ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Mapa_Base" mb on mb.id = m.id_mapa_base 
                                                                left join ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Idioma" imb on mb.id = imb.id_mapa_base  and imb.referencia_atributo = 'nom' and imb.id_mapa is null and imb.id_grupo_capas is null and imb.id_tipologia is null and imb.id_categoria  is null and imb.lang = $1
                                                                where m.id_tipologia = t.id and m.id_categoria = c.id
                                                        ) maps	
                                                ) as mapas
                                        from ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Categoria" c 
                                        left join ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Idioma" ic on c.id = ic.id_categoria  and ic.referencia_atributo = 'nom' and ic.id_mapa is null and ic.id_mapa_base is null and ic.id_grupo_capas is null and ic.id_tipologia = t.id and ic.lang = $1
                                        where c.id_tipologia = t.id
                                ) categories
                        ) as categorias
                from ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Tipologia" t 
                left join ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Idioma" it on t.id = it.id_tipologia and it.referencia_atributo = 'nom' and it.id_mapa is null and it.id_mapa_base is null and it.id_grupo_capas is null and it.id_categoria is null and it.lang = $1
        ) tipologies
`;


// Return a list of maps with its id, name. (unused so far)
// Variables needed (order-sensitive): [lang, tipology]
// export const Qry_GetMapList = `
//         select array_to_json(array_agg(maps))
//         from (
//                 select
//                         m.id as idMapa,
//                         m.orden_en_lista as orden,
//                         im.texto as nombre,
//                         m."habilitado_SN" as habilitado,
//                         ic.texto as categoria
//                 from ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Mapa" m
//                 left join ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Idioma" im on m.id = im.id_mapa and im.referencia_atributo = 'nom' and im.id_mapa_base is null and im.id_grupo_capas is null and im.id_tipologia is null and im.id_categoria is null and im.lang = $1
//                 left join ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Categoria" c on m.id_categoria = c.id and m.id_tipologia = c.id_tipologia
//                 left join ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Idioma" ic on c.id = ic.id_categoria and m.id_tipologia = ic.id_tipologia and ic.referencia_atributo = 'nom' and ic.id_mapa_base is null and ic.id_grupo_capas is null and ic.lang = $1
//                 left join ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Tipologia" t on m.id_tipologia = t.id
//                 left join ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Idioma" it on t.id = it.id_tipologia and it.referencia_atributo = 'nom' and it.id_mapa_base is null and it.id_grupo_capas is null and it.id_mapa is null and it.id_categoria is null and it.lang = $1
//                 where it.texto = $2
//                 order by orden asc
//         ) maps
// `;

// Return a list of maps.
// Required parameters: [lang]
export const Qry_AllMaps = `
        select 
                "idMapa",
                "nomMapa",
                "idTipologia",
                "nomTipologia" as "textoTipologia",
                "idCategoria",
                "nomCategoria" as "textoCategoria",
                "descCategoria",
                "claveExternaContenidoCategoria",
                "argisMapName" as "arcgisMapName",
                "tags",
                "escalaDefecto", 
                "escalaMin", 
                "escalaMax", 
                "idMapaBase",
                "urlMapaBase",
                "nomMapaBase",
                "habilitadoSN",
                "descargableSN",
                "ordenEnLista"
        from ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."MapaJoinsView" mjv
        where mjv."lang" = $1 and mjv."idMapa" is not null
`

// Return a list of maps filtered by tipology.
// Required parameters (order-sensitive): [lang, idTopologia]
export const Qry_mapInfoByTopology = `
        select 
                "idMapa",
                "nomMapa",
                "idTipologia",
                "nomTipologia" as "textoTipologia",
                "idCategoria",
                "nomCategoria" as "textoCategoria",
                "descCategoria",
                "claveExternaContenidoCategoria",
                "argisMapName" as "arcgisMapName",
                "tags",
                "escalaDefecto", 
                "escalaMin", 
                "escalaMax", 
                "idMapaBase",
                "urlMapaBase",
                "nomMapaBase",
                "habilitadoSN",
                "descargableSN",
                "ordenEnLista"
        from ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."MapaJoinsView" mjv
        where mjv."lang" = $1 and mjv."idTipologia" = $2 and mjv."idMapa" is not null
`


// Return all the information of a map, given its id
// Variables needed (order-sensitive): [lang, id]
export const Qry_GetMapById = `
        select 
                "idMapa",
                "nomMapa",
                "idTipologia",
                "nomTipologia" as "textoTipologia",
                "idCategoria",
                "nomCategoria" as "textoCategoria",
                "descCategoria",
                "claveExternaContenidoCategoria",
                "argisMapName" as "arcgisMapName",
                "tags",
                "escalaDefecto", 
                "escalaMin", 
                "escalaMax", 
                "idMapaBase",
                "urlMapaBase",
                "nomMapaBase",
                "habilitadoSN",
                "descargableSN",
                "ordenEnLista"
        from ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."MapaJoinsView" mjv
        where mjv."lang" = $1 and mjv."idMapa" = $2
`;

// Updates the habilitado_SN value for a map in all its languages, given its id
// Variables needed (order-sensitive): [id, newValue]
export const Qry_UpdtHabilitadoValueByMapId = `
        UPDATE ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Mapa"
        SET "habilitado_SN" = $2
        WHERE id = $1
        RETURNING *;
`

// Deletes the current tags for a given map in a given language
// Variables needed (order-sensitive): [lang, id_mapa]
export const Qry_DeleteCurrentTagsForMaps = `
        delete from ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Idioma"
        where lang = $1 and id_mapa = $2 and referencia_atributo = 'tags';
`


// Upserts the Idioma table for maps entity
// Variables needed (order-sensitive): [lang, referencia_atributo (nom/tags), id_mapa, texto]
export const Qry_UpsrtIdiomaForMaps = `
        insert into ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Idioma" 
        (lang, referencia_atributo, id_mapa, id_mapa_base, id_grupo_capas, id_tipologia, id_categoria, texto)
        values 
        ($1  , $2                 , $3     , null        , null          , null        , null        , $4   )
        on conflict (lang, referencia_atributo, COALESCE(id_mapa, 0), COALESCE(id_mapa_base, 0), COALESCE(id_grupo_capas, 0), COALESCE(id_tipologia, ''), COALESCE(id_categoria, ''))
        do update set texto = excluded.texto
        returning *
`

// Variables needed (order-sensitive): [lang, id_mapa]
export const Qry_GetGroupLayerByMapIdAndLang = `
        select
                gc."id",
                gc."id_mapa",
                "rango_escala_visible_en_TOC",
                "visible_en_TOC_por_defecto",
                "tipo_capa",
                "arcgis_groupLayerId",
                "consultable",
                "clave_externa_contenido",
                "texto" as "nomGrupoCapas"
        from ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Grupo_Capas" gc
        left join ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Idioma" i
        on gc.id = i.id_grupo_capas
        where gc.id_mapa = $2 and i.lang = $1
        order by gc."id" asc
`


// Upserts the Idioma table for group layer entity
// Variables needed (order-sensitive): [lang, id_grupo_capas, texto]
export const Qry_UpsrtIdiomaForGroupLayers = `
        insert into ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Idioma" 
        (lang, referencia_atributo, id_mapa, id_mapa_base, id_grupo_capas, id_tipologia, id_categoria, texto)
        values 
        ($1  , 'nom'              , null   , null        , $2            , null        , null        , $3   )
        on conflict (lang, referencia_atributo, COALESCE(id_mapa, 0), COALESCE(id_mapa_base, 0), COALESCE(id_grupo_capas, 0), COALESCE(id_tipologia, ''), COALESCE(id_categoria, ''))
        do update set texto = excluded.texto
        returning *
`


// Delete a map given its id
// Variables needed: [id]
export const Qry_DeleteMapById = `
        DELETE FROM ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Mapa"
        WHERE id = $1
        RETURNING id;
`


// Return all categories
// Variables needed: [lang]
export const Qry_Categories = `
        select array_to_json(array_agg(categories))
        from (
                select
                        c.id as "idCategoria",
                        ic.texto as "textoCategoria",
                        icd.texto as "textoDescripcion",
                        c.id_tipologia as "idTipologia",
                        it.texto as "textoTipologia",
                        c.clave_externa_contenido as "claveExternaContenido"
                from ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Categoria" c
                left join ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Idioma" ic on c.id = ic.id_categoria and c.id_tipologia = ic.id_tipologia and ic.referencia_atributo = 'nom' and ic.id_mapa is null and ic.id_mapa_base is null and ic.id_grupo_capas is null and ic.lang = $1
                left join ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Idioma" icd on c.id = icd.id_categoria and c.id_tipologia = icd.id_tipologia and icd.referencia_atributo = 'desc' and icd.id_mapa is null and icd.id_mapa_base is null and icd.id_grupo_capas is null and icd.lang = $1
                left join ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Tipologia" t on c.id_tipologia = t.id
                left join ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Idioma" it on t.id = it.id_tipologia and it.referencia_atributo = 'nom' and it.id_mapa is null and it.id_mapa_base is null and it.id_grupo_capas is null and it.id_categoria is null and it.lang = $1
                order by case when it.texto = 'Proposta' then 1
                              when it.texto = 'Diagnosi' then 2
                              when it.texto = 'Informació' then 3
                              else 4 end
        ) categories
`;

// Return a category with a specific id and tipology
// Variables-needed (order-sensitive): [lang, id, tipologyId]
export const Qry_CategoryByIdAndTipology = `
        select
                c.id as "idCategoria",
                ic.texto as "textoCategoria",
                icd.texto as "textoDescripcion",
                c.id_tipologia as "idTipologia",
                it.texto as "textoTipologia",
                c.clave_externa_contenido as "claveExternaContenido"
        from ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Categoria" c
        left join ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Idioma" ic on c.id = ic.id_categoria and c.id_tipologia = ic.id_tipologia and ic.referencia_atributo = 'nom' and ic.id_mapa is null and ic.id_mapa_base is null and ic.id_grupo_capas is null and ic.lang = $1
        left join ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Idioma" icd on c.id = icd.id_categoria and c.id_tipologia = ic.id_tipologia and icd.referencia_atributo = 'desc' and icd.id_mapa is null and icd.id_mapa_base is null and icd.id_grupo_capas is null and icd.lang = $1
        left join ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Tipologia" t on c.id_tipologia = t.id
        left join ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Idioma" it on t.id = it.id_tipologia and it.referencia_atributo = 'nom' and it.id_mapa is null and it.id_mapa_base is null and it.id_grupo_capas is null and it.id_categoria is null and it.lang = $1
        where c.id = $2 and c.id_tipologia = $3
`

// Updates the content external key from a category, given its id and its tipology id
// Variables needed (order-sensitive): [id, tipologyId, newContentExternalKey]
export const Upd_CategoryByIdAndTipology = `
        update 
                ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Categoria" c
        set
                clave_externa_contenido = $3
        where c.id = $1 and c.id_tipologia = $2
`;

// Updates (or creates if non-existing) the description of a category in table "Idioma", given the id and the tipology of the category.
// Variables needed (order-sensitive): [lang, id, tipologyId, newDescription]
export const Upd_CategoryDescriptionByIdAndTipology = `
        insert into ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Idioma" 
        (lang, referencia_atributo, id_mapa, id_mapa_base, id_grupo_capas, id_tipologia, id_categoria, texto)
        values 
        ($1  , 'desc'             , null   , null        , null          , $3          , $2          , $4   )
        on conflict (lang, referencia_atributo, COALESCE(id_mapa, 0), COALESCE(id_mapa_base, 0), COALESCE(id_grupo_capas, 0), COALESCE(id_tipologia, ''), COALESCE(id_categoria, ''))
        do update set texto = excluded.texto
`;

// Variables needed (order-sensitive): [lang]
export const Qry_BasemapsWithName = `
        select
                mb."id",
                mb."url",
                "texto" as "nom"
        from ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Mapa_Base" mb
        left join ${process.env.PDB_DBNAME}.${process.env.PDB_COLLECTION}."Idioma" i
        on mb.id = i.id_mapa_base
        where i.lang = $1
`