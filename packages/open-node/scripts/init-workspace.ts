import { WorkspaceService } from '../src/services';

async function main() {
  const workspaceService = new WorkspaceService();

  const workspace = await workspaceService.createWorkspace({
    name: 'default-workspace',
    description: 'Default workspace for testing'
  });

  console.log('Workspace created:', workspace);
}

main().catch(console.error);
