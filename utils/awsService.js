import * as AWS from "aws-sdk";
import { v4 as uuid } from "uuid";

const AWS_S3_BUCKET = "bucket name";
const s3 = new AWS.S3({
  accessKeyId: "bucket access key Id",
  secretAccessKey: " secret access key",
});

export const awsService = async (file) => {
  if (file && file.originalname) {
    // const urlKey = file.originalname == 'blob' ? `${uuid()}.mp4` : `${uuid()}-${file.originalname}`;
    const urlKey = `${uuid()}-${file.originalname}`;
    const params = {
      Body: file.buffer,
      Bucket: AWS_S3_BUCKET,
      Key: urlKey,
      // ContentType: file.mimetype == 'video/webm' ? 'video/mp4' : file.mimetype,
      ContentType: file.mimetype,
      ACL: "public-read",
    };

    const uploadResult = await s3.upload(params).promise();
    return uploadResult;
  }
  return null;
};
