const awsRequest = require('serverless/lib/aws/request');

class SlsHelper {
  constructor(serverless) {
    this.serverless = serverless;
  }

  get awsProvider() {
    return this.serverless.getProvider('aws');
  }

  get region() {
    return this.awsProvider.getRegion();
  }

  get env() {
    return this.awsProvider.getStage();
  }

  get stackName() {
    return this.awsProvider.naming.getStackName();
  }

  createAwsClientConfig(region) {
    if (region === null) {
      region = this.region;
    }
    return {
      credentials: this.awsProvider.getCredentials().credentials,
      region,
    };
  }

  createAwsClient(service) {
    return new this.awsProvider.sdk[service](this.createAwsClientConfig());
  }

  sendAwsRequest(service, command, args) {
    let region = this.region;
    if (service === 'Organizations') {
      region = 'us-east-1';
    }
    return awsRequest({name: service, params: this.createAwsClientConfig(region)}, command, args);
  }
}

module.exports = SlsHelper;
