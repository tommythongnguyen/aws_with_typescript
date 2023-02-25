import { Bucket, CreateBucketCommand, ListBucketsCommand, S3Client } from '@aws-sdk/client-s3';
import { ICredentails } from '../../auth/aws-auth.interface';

export class S3Service {
  public s3Client: S3Client;
  constructor(region: string, credentials: ICredentails) {
    this.s3Client = new S3Client({ region, credentials });
  }

  public async createS3Bucket(name: string): Promise<any> {
    try {
      // check if bucket with that name is already exists or not
      const buckets = await this.getAllS3Buckets();
      const bucketWithName = buckets?.find((bucket: Bucket) => bucket.Name === name);
      if (bucketWithName) {
        console.warn(`Bucket ${name} already exists!!`);
        return bucketWithName;
      }
      const data = await this.s3Client.send(new CreateBucketCommand({ Bucket: name }));
      console.log('\n --------Successfully create a new Bucket: ----');
      console.log(data);
    } catch (error) {
      console.log(`Something went wrong when creating bucket ${name}`);
    }
  }

  public async getAllS3Buckets(): Promise<Bucket[] | undefined> {
    try {
      const data = await this.s3Client.send(new ListBucketsCommand({}));
      console.log(`\n-------Success. Here is all buckets under this account:---`);
      console.log(data.Buckets);
      return data.Buckets;
    } catch (error) {
      console.log(`Something went wrong while get all buckets`);
    }
  }
}
