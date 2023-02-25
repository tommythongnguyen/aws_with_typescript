import { IAMClient, ListUsersCommand } from '@aws-sdk/client-iam';
import { STSClient, GetSessionTokenCommand } from '@aws-sdk/client-sts';
import { fromIni } from '@aws-sdk/credential-provider-ini';

export const REGION = 'us-east-1';

export class AWSAuth {
  private loggedInCredentails: any;

  private iamClient!: IAMClient;
  private stsClient!: STSClient;

  public async login(accessKeyId?: string, secretAccessKey?: string): Promise<IAMClient> {
    if (await this.isUserLoggedIn()) {
      return this.iamClient;
    }
    let credentials = {
      accessKeyId: '',
      secretAccessKey: '',
    };

    if (!accessKeyId || !secretAccessKey) {
      const credentialsAsync = fromIni({ profile: 'default' });
      credentials = await credentialsAsync();
    } else {
      credentials.accessKeyId = accessKeyId;
      credentials.secretAccessKey = secretAccessKey;
    }
    this.iamClient = new IAMClient({ region: REGION, credentials });

    console.log('Login successful: ', this.iamClient?.config.credentials());
    return this.iamClient;
  }

  public async loginWithSTS(accessKeyId?: string, secretAccessKey?: string): Promise<any> {
    try {
      // check if user profile accessKeyId and secretAccessKey exist
      const credentialsAsync = fromIni({ profile: 'default' });

      const getSessionTokenCommand = new GetSessionTokenCommand({
        DurationSeconds: 360,
        TokenCode: '928939',
      });
      const { accessKeyId, secretAccessKey } = await credentialsAsync();
      this.stsClient = new STSClient({
        region: REGION,
        credentials: { accessKeyId, secretAccessKey },
      });

      const result = await this.stsClient.send(getSessionTokenCommand);

      this.loggedInCredentails = result.Credentials;
      console.log(`Successfully logged in with STSClient and generate session token: ${result.Credentials}`);
    } catch (err) {
      console.log('error while logged in with STSClient');
    }
  }

  public async isUserLoggedIn(): Promise<boolean> {
    try {
      const data = await this.iamClient?.send(new ListUsersCommand({ MaxItems: 10 }));

      const users = data.Users || [];
      users.forEach(user => {
        console.log(`User: ${user.UserName} created: ${user.CreateDate}`);
      });
      return true;
    } catch (error) {
      console.log(`User is not logged in`);
      return false;
    }
  }
}
