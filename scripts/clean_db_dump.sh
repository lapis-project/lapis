#!/bin/bash

# Target file inside the db folder
SQL_FILE="db/lapis_dump.sql"

# Argon2 hash for dev instances (default password 'test')
PW_HASH='$argon2id$v=19$m=16,t=2,p=1$RG1EbDBCOTV3Y012cXFmVg$Yb47uU3Gy+L4DRh7tec78g'

# Check if the file exists before processing
if [ ! -f "$SQL_FILE" ]; then
    echo "Error: $SQL_FILE not found."
    exit 1
fi

echo "Processing $SQL_FILE: Anonymizing users, setting dev passwords, and clearing sessions..."

# Temporary file for processing
TEMP_FILE=$(mktemp)

# Use awk to process the file with a state machine
awk -F'\t' -v pw="$PW_HASH" '
BEGIN { 
    OFS="\t"; 
    user_n=1; 
    state="DEFAULT"; 
}

# --- State: DEFAULT ---
state == "DEFAULT" {
    if ($0 ~ /^COPY lapis_dev.user_account/) {
        print $0;
        state = "USER_ACCOUNT";
        next;
    }
    if ($0 ~ /^COPY lapis_dev.user_session/) {
        print $0;
        state = "USER_SESSION";
        next;
    }
    print $0;
}

# --- State: USER_ACCOUNT (Sanitize data & Set Password) ---
state == "USER_ACCOUNT" {
    if ($0 ~ /^\\\./) {
        print $0;
        state = "DEFAULT";
        next;
    }
    # Anonymize columns: 
    # $2: email, $3: firstname, $4: lastname, $5: username, $6: password
    $2 = "test.user" user_n "@oeaw.ac.at";
    $3 = "Test";
    $4 = "User" user_n;
    $5 = "tuser" user_n;
    $6 = pw;
    print $0;
    user_n++;
}

# --- State: USER_SESSION (Delete all entries) ---
state == "USER_SESSION" {
    if ($0 ~ /^\\\./) {
        print $0;
        state = "DEFAULT";
    }
    # Do nothing for lines inside this block (effectively deleting them)
}
' "$SQL_FILE" > "$TEMP_FILE"

mv "$TEMP_FILE" "$SQL_FILE"

echo "Done. User data sanitized and passwords updated to dev default."