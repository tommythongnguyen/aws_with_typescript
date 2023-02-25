import { CreatePolicyCommand, IAMClient, ListPoliciesCommand, Policy, PolicyScopeType } from '@aws-sdk/client-iam';

export class IamPolicyService {
  private iamClient: IAMClient;

  private readonly myManagedPolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: ['s3:ListAllMyBuckets', 'sts:AssumeRole'],
        Resource: '*',
      },
    ],
  };

  constructor(public loggedInIamClient: IAMClient) {
    this.iamClient = loggedInIamClient;
  }

  public async createPolicy(policyName: string, policy?: any): Promise<Policy | undefined> {
    try {
      // get all local managed policies created by this account
      // and check if the policy with policyName is exist or not
      const existingPolicies = await this.getPolicies();
      if (existingPolicies && existingPolicies.length) {
        const isExist = existingPolicies.some((policy: Policy) => policy.PolicyName === policyName);
        if (isExist) {
          console.log(`Policy ${policyName} is already exist!!!`);
          return;
        }
      }
      policy = policy ? policy : this.myManagedPolicy;
      const policy_params = {
        PolicyDocument: JSON.stringify(policy),
        PolicyName: policyName,
      };

      // let create new policy
      const { Policy } = await this.iamClient.send(new CreatePolicyCommand(policy_params));
      console.log(`Success. Policy ${Policy?.PolicyName} created. \n Policy details: ${Policy}`);
      return Policy;
    } catch (error) {
      console.log(`Something went wrong while create a new policy`);
    }
  }

  public async getPolicies(scope?: PolicyScopeType): Promise<Policy[] | undefined> {
    try {
      scope = scope || PolicyScopeType.Local;
      const { Policies } = await this.iamClient.send(new ListPoliciesCommand({ Scope: scope }));
      console.log(`Success. Getting list of policies: `, Policies);
      return Policies;
    } catch (error) {
      console.log(`Something went wrong while getting list of policies`);
    }
  }
}
