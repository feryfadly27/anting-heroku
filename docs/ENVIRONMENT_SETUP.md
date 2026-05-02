# Environment Variables Setup

## Required Environment Variables

This project requires PostgreSQL connection settings in your `.env` file.

### For Development

Create a `.env` file in the root directory with the following variables:

```bash
# PostgreSQL connection string (required)
DATABASE_URL="postgresql://postgres:your_password@127.0.0.1:5432/sir_kp_banting?schema=public"
```

### How to Prepare Your Credentials

1. Install and run PostgreSQL locally or in Docker/Podman
2. Create database `sir_kp_banting`
3. Fill `DATABASE_URL` with username, password, host, and port yang sesuai

### Security Notes

- Jangan commit `.env` ke repository
- Gunakan password PostgreSQL yang kuat
- Batasi akses port database hanya untuk host yang dibutuhkan

### Troubleshooting

**Error: `Error loading route module`**
- Check that your `.env` file exists in the root directory
- Restart the development server after adding environment variables

**Database connection fails**
- Verify `DATABASE_URL` format is correct
- Ensure PostgreSQL service is running and reachable
