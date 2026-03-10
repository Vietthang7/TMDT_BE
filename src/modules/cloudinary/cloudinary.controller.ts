import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { CloudinaryService } from './cloudinary.service';

@ApiTags('Upload')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('upload')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a single file to Cloudinary' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully.' })
  uploadSingle(@UploadedFile() file: Express.Multer.File) {
    return this.cloudinaryService.uploadFile(file, 'ecommerce');
  }

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload multiple files to Cloudinary (max 10)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
      required: ['files'],
    },
  })
  @ApiResponse({ status: 201, description: 'Files uploaded successfully.' })
  uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    return this.cloudinaryService.uploadMultipleFiles(files, 'ecommerce');
  }

  @Delete(':publicId')
  @ApiOperation({ summary: 'Delete a file from Cloudinary by public ID' })
  @ApiResponse({ status: 200, description: 'File deleted.' })
  remove(@Param('publicId') publicId: string) {
    return this.cloudinaryService.deleteFile(publicId);
  }
}
