import {
  AttachRolePolicyCommand,
  AttachRolePolicyRequest,
  CreateRoleCommand,
  IAMClient,
  ListRolesCommand,
  Role,
} from '@aws-sdk/client-iam';
import { wait } from '../util';

export class RoleService {
  private iamClient: IAMClient;
  private readonly default_trust_relationships_role_json = {
    Version: '2012-10-17',
    Statements: [
      {
        Effect: 'Allow',
        Pricipal: {
          AWS: '', // aws services or arn of application or user
        },
        Action: 'sts:AssumeRole',
      },
    ],
  };

  constructor(public loggedInIAMClient: IAMClient) {
    this.iamClient = loggedInIAMClient;
  }

  public async getRoles(): Promise<Role[] | undefined> {
    try {
      const { Roles } = await this.iamClient.send(new ListRolesCommand({}));
      console.log('\n----Success. Here is list of roles created by this account: ');
      console.log(Roles);
      return Roles;
    } catch (error) {
      console.error(`Something went wrong while get list of Role`);
    }
  }

  public async createRole(rolename: string, trust_relationships_role_json: any): Promise<Role | undefined> {
    try {
      // ------ check if the role with rolename is already exist ------------------
      const roles = await this.getRoles();
      const roleWithName = roles?.find((role: Role) => role.RoleName === rolename);
      if (roleWithName) {
        console.log(`Role ${rolename} is already exist`);
        return roleWithName;
      }

      const { Role } = await this.iamClient.send(
        new CreateRoleCommand({
          RoleName: rolename,
          AssumeRolePolicyDocument: JSON.stringify(trust_relationships_role_json),
          Path: '/',
        }),
      );
      console.log('\n----Success. Here is list of roles created by this account: ');
      console.log(Role);
      return Role;
    } catch (error: any) {
      console.error(`Something went wrong when creating Role ${rolename}: `, error.Error.message);
    }
  }

  public async attachRolePolicy(permissionPolicyArns: string[], rolename: string) {
    try {
      permissionPolicyArns.forEach(async (policyArn: string) => {
        const params: AttachRolePolicyRequest = {
          PolicyArn: policyArn,
          RoleName: rolename,
        };
        const data = await this.iamClient.send(new AttachRolePolicyCommand(params));
        console.log(`Successful add permisionPolicyArn ${policyArn} to role ${rolename}`, data);
        wait(2000);
      });
    } catch (error) {
      console.log(`Something went wrong when add Permission policy arn to role ${rolename}`);
    }
  }
}
