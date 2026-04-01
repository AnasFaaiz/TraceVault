/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('collections')
@UseGuards(JwtAuthGuard)
export class CollectionsController {
  constructor(private collectionsService: CollectionsService) {}

  @Get()
  async getCollections(@Request() req) {
    return this.collectionsService.getCollections(req.user.userId);
  }

  @Post()
  async createCollection(
    @Request() req,
    @Body() body: { name: string; description?: string; visibility?: string },
  ) {
    return this.collectionsService.createCollection(req.user.userId, body);
  }

  @Get(':id')
  async getCollection(@Request() req, @Param('id') id: string) {
    return this.collectionsService.getCollectionDetail(req.user.userId, id);
  }

  @Patch(':id')
  async updateCollection(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; visibility?: string },
  ) {
    return this.collectionsService.updateCollection(req.user.userId, id, body);
  }

  @Delete(':id')
  async deleteCollection(@Request() req, @Param('id') id: string) {
    await this.collectionsService.deleteCollection(req.user.userId, id);
    return { success: true };
  }

  @Post(':id/entries')
  async toggleCollectionEntry(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { entryId: string },
  ) {
    return this.collectionsService.toggleEntry(
      req.user.userId,
      id,
      body.entryId,
    );
  }

  @Get('/for-entry/:entryId')
  async getCollectionsForEntry(
    @Request() req,
    @Param('entryId') entryId: string,
  ) {
    return this.collectionsService.getCollectionsForEntry(
      req.user.userId,
      entryId,
    );
  }
}
