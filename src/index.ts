import { IAMClient, StatusType, User } from '@aws-sdk/client-iam';
import { AWSAuth, REGION } from './auth/aws-auth';
import { ICredentails } from './auth/aws-auth.interface';
import { IamPolicyService } from './shared/iam/policy';
import { RoleService } from './shared/iam/role';
import { IamUserService } from './shared/iam/user';
import { S3Service } from './shared/s3/s3';
import { wait } from './shared/util';
const username = 'Tommy';
export const start = async () => {
  // let credentials: ICredentails = {
  //   accessKeyId: '',
  //   secretAccessKey: '',
  // };

  // let login with default credentials from .aws/credentials file
  const _awsAuthClient = new AWSAuth();
  const _awsClient = await _awsAuthClient.login();

  //=================User==============================
  const iamUser = new IamUserService(_awsClient);

  //await iamUser.createUser(iamUser, true);

  //await iamUser.getUser(username);

  // await iamUser.getUsers();

  // wait(5000);
  // await iamUser.createAccessKeyForUser(username);

  // await iamUser.deleteUser(username);

  // await iamUser.updateUserAccessKeyStatus(
  //   username,
  //   "AKIATGVFZX276JG5Z64Y",
  //   StatusType.Inactive
  // );
  // await iamUser.deleteUserAccessKey(username, "AKIATGVFZX27WKNJBIFP");

  //=======================Policy=======================
  // const policyService = new IamPolicyService(_awsClient);
  // await policyService.createPolicy('allow-access-s3');

  //=======================S3==========================
  /**
   * UserName: 'Tommy',
    AccessKeyId: 'AKIATGVFZX27QCE7KYCE',
    Status: 'Active',
    SecretAccessKey: '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',
   */

  // const s3Service = new S3Service(REGION, {
  //   accessKeyId: 'AKIATGVFZX276ZC3MVUU',
  //   secretAccessKey: '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',
  // } as ICredentails);

  // await s3Service.getAllS3Buckets();

  //============================Roles===========================================
  const roleService = new RoleService(_awsClient);
  // await roleService.getRoles();
  //1--- create role with trust_relationsip json
  await createRoleWithTrustRelationshipsJson(roleService, 'AllowUserToAccessS3Role');
  // assign managed Permission policy json to this role
  await roleService.attachRolePolicy(['arn:aws:iam::220464791231:policy/allow-access-s3'], 'AllowUserToAccessS3Role');
};
start();

async function createRoleWithTrustRelationshipsJson(roleService: RoleService, roleName: string): Promise<any> {
  const trust_relationships_role_json = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: {
          AWS: 'arn:aws:iam::220464791231:user/Tommy',
        },
        Action: 'sts:AssumeRole',
      },
    ],
  };
  return await roleService.createRole(roleName, trust_relationships_role_json);
}
