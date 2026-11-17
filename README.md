This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Image storage

Club profile images, cover images, and event thumbnails are stored in MinIO. Configure `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` in `.env`; the app uses `http://localhost:9000` and creates the `ai-hub-media` bucket by default. Set `MINIO_ENDPOINT` and `MINIO_BUCKET` to override those defaults. The application serves stored images through its own `/api/media` route, so the bucket can remain private.

Ticket emails are sent over SMTP with a PDF ticket attachment. Configure `MAIL_HOST`, `MAIL_PORT`, and `MAIL_FROM` in `.env`; set `MAIL_USER` and `MAIL_PASSWORD` when your SMTP provider requires authentication. Set `MAIL_SECURE=true` for implicit TLS (commonly port 465); otherwise the default port is 587 with STARTTLS.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
