"""Create (or reset the password of) the single admin account.

Usage:  python create_admin.py fati@example.com
You will be prompted for the password (min 10 chars). Nothing is stored in code or env.
"""
import getpass
import sys

from app.db import ensure_indexes, get_db, now
from app.security import hash_password


def main():
    if len(sys.argv) != 2 or "@" not in sys.argv[1]:
        sys.exit("Usage: python create_admin.py <email>")
    email = sys.argv[1].strip().lower()
    pw = getpass.getpass("Password (min 10 chars): ")
    if len(pw) < 10:
        sys.exit("Password must be at least 10 characters.")
    if pw != getpass.getpass("Repeat password: "):
        sys.exit("Passwords do not match.")
    ensure_indexes()
    get_db().users.update_one(
        {"email": email},
        {"$set": {"password_hash": hash_password(pw), "role": "admin"}, "$setOnInsert": {"created_at": now()}},
        upsert=True,
    )
    print(f"Admin ready: {email}")


if __name__ == "__main__":
    main()
