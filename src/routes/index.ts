import { HealthController } from '@server/controllers/health'
import { MapController } from '@server/controllers/map'
import { CategoryController } from '@server/controllers/category'
import { LiferayController } from '@server/controllers/liferay'
import { LiferayImageController } from '@server/controllers/liferayImage'
import { BaseMapController } from '@server/controllers/basemap'
import { ScaleController } from '@server/controllers/scale'
import { LayerGroupController } from '@server/controllers/layerGroup'
import { RelationController } from '@server/controllers/relation'
import { ArcGISController } from '@server/controllers/arcgis'

export const routes = { 
  ArcGISController,
  BaseMapController,
  CategoryController,
  HealthController,
  LayerGroupController,
  LiferayController,
  LiferayImageController,
  MapController,
  RelationController,
  ScaleController
} 

