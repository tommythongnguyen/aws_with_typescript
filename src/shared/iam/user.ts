import {
  CreateUserCommand,
  GetUserCommand,
  IAMClient,
  User,
  DeleteUserCommand,
  ListUsersCommand,
  CreateAccessKeyCommand,
  ListAccessKeysCommand,
  DeleteAccessKeyCommand,
  UpdateAccessKeyCommand,
  StatusType,
  AccessKey,
} from '@aws-sdk/client-iam';
import { wait } from '../util';

export class IamUserService {
  private _user?: User;
  private iamClient: IAMClient;

  constructor(public loggedInIAMClient: IAMClient) {
    this.iamClient = loggedInIAMClient;
  }

  get user(): any {
    return this._user;
  }

  public async getUser(username: string): Promise<User | undefined> {
    try {
      const { User } = await this.iamClient.send(new GetUserCommand({ UserName: username }));
      if (User) {
        console.log(`Return user ${User?.UserName}: `, User);
        return User;
      }
      console.log(`User ${username} does not exist.`);
      return;
    } catch (error) {
      console.log(`There is no User ${username} exists`);
    }
  }

  public async getUsers(): Promise<User[] | undefined> {
    try {
      const { Users } = await this.iamClient.send(new ListUsersCommand({}));
      console.log(`Success. Here is list of users: `, Users);
      return Users;
    } catch (error) {
      console.log('something went wrong');
    }
  }

  public async createUser(username: string, withAccessKey = false): Promise<any> {
    const param = { UserName: username };
    try {
      // check if user with username is already exist
      const user = await this.getUser(username);
      if (user) {
        console.log(`User ${user.UserName} is already exists!`);
        return;
      }
      const newUserCommand = new CreateUserCommand(param);
      const { User } = await this.iamClient.send(newUserCommand);

      if (withAccessKey) {
        wait(5000);
        await this.createAccessKeyForUser(username);
      }

      console.log(`User ${User?.UserName} with arn ${User?.Arn} created!`);
      this._user = User;
      return User;
    } catch (error) {
      console.log(`Something went wrong while creating User ${username}`);
    }
  }

  public async deleteUser(username: string) {
    try {
      const user = await this.getUser(username);

      if (!user) {
        console.log(`User ${username} does not exist!`);
        return;
      }
      // -- need to delete all active accessKeys first---
      const { AccessKeyMetadata } = await this.iamClient.send(new ListAccessKeysCommand({ UserName: username }));

      await AccessKeyMetadata?.forEach(async (accessKeyMeta: any) => {
        await this.deleteUserAccessKey(accessKeyMeta.UserName as string, accessKeyMeta.AccessKeyId as string);
      });

      console.log('\nWaiting 10 seconds for deleting accessKeys...\n');

      wait(10000);
      const response = await this.iamClient.send(new DeleteUserCommand({ UserName: user?.UserName }));

      console.log(`User "${user.UserName}" deleted successfully: ${response.$metadata.httpStatusCode}`);
      return;
    } catch (err) {
      console.log(`something went wrong while delete user ${username}}`, err);
    }
  }

  public async createAccessKeyForUser(username: string): Promise<AccessKey | undefined> {
    try {
      //check if user already exist
      const user = await this.getUser(username);
      if (!user) {
        console.error(
          `User ${username} does not exist. Need to create that user first before create accessKey for that user!`,
        );
        return;
      }

      const { AccessKeyMetadata } = await this.iamClient.send(new ListAccessKeysCommand({ UserName: username }));
      if (AccessKeyMetadata?.length) {
        console.log(`User ${username} does have accesskey already: `, AccessKeyMetadata);
        return;
      }

      const { AccessKey } = await this.iamClient.send(new CreateAccessKeyCommand({ UserName: username }));
      console.log('Success. Access key created: ', AccessKey);
      return AccessKey;
    } catch (error) {
      console.log(`Something went wrong while creating accessKey for user ${username}`);
    }
  }

  public async updateUserAccessKeyStatus(username: string, accessKeyId: string, status: StatusType): Promise<any> {
    try {
      const result = await this.iamClient.send(
        new UpdateAccessKeyCommand({
          AccessKeyId: accessKeyId,
          Status: status,
          UserName: username,
        }),
      );
      console.log(`Successful ${status} accessKey ${accessKeyId} for user ${username}: `, result);
    } catch (error) {
      console.error(`Something went wrong while ${status} accessKey for user ${username}`);
    }
  }

  public async deleteUserAccessKey(username: string, accessKeyId: string) {
    try {
      // make sure this user's accessKey is not active. If not ,then we need to deactive it before delete it.
      await this.updateUserAccessKeyStatus(username, accessKeyId, StatusType.Inactive);

      const result = await this.iamClient.send(
        new DeleteAccessKeyCommand({
          AccessKeyId: accessKeyId,
          UserName: username,
        }),
      );
      console.log(`Successful delete accessKey ${accessKeyId} for user ${username}: `, result);
    } catch (error) {
      console.error(`Something went wrong while delete accessKey for user ${username}`);
    }
  }
}
