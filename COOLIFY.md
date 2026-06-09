# Coolify Deployment

Use the GitHub repository `celnetamit/Journal_cover_pages` and deploy the `main` branch.

## Recommended Coolify Settings

- Resource type: Application
- Source: GitHub
- Repository: `celnetamit/Journal_cover_pages`
- Branch: `main`
- Build pack: Dockerfile
- Dockerfile location: `/Dockerfile`
- Port exposed by app: `3000`
- Health check path: `/`
- Environment variables: none required

## Domain

Add your domain in Coolify after the first successful deployment. Coolify will proxy traffic to container port `3000`.

## Notes

The app is a Next.js standalone production build. The Docker image runs:

```bash
node server.js
```

The journal data comes from `journals_list.csv`, which is committed in the repository.
