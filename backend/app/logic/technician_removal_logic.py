from __future__ import annotations


def ensure_removal_table(db) -> None:
    cursor = db.cursor()
    try:
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS technician_account_removals (
                technician_id INT PRIMARY KEY,
                disabled_at TIMESTAMP NOT NULL,
                removal_due_at TIMESTAMP NOT NULL,
                removed_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT fk_technician_account_removals_technician
                    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_technician_removal_due_at (removal_due_at),
                INDEX idx_technician_removed_at (removed_at)
            )
            """
        )
        db.commit()
    finally:
        cursor.close()


def sync_expired_removals(db) -> None:
    ensure_removal_table(db)

    cursor = db.cursor()
    try:
        cursor.execute(
            """
            UPDATE technician_account_removals
            SET removed_at = UTC_TIMESTAMP()
            WHERE removed_at IS NULL
              AND removal_due_at <= UTC_TIMESTAMP()
            """
        )
        cursor.execute(
            """
            UPDATE users u
            INNER JOIN technician_account_removals r
                ON r.technician_id = u.id
            SET u.is_active = FALSE
            WHERE u.role = 'technician'
              AND r.removed_at IS NOT NULL
            """
        )
        db.commit()
    finally:
        cursor.close()
