// Helper function to delay running the code while the AWS service calls wait for responses.
export function wait(ms: number) {
  var start = Date.now();
  var end = start;
  while (end < start + ms) {
    end = Date.now();
  }
}
