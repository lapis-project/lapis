#!/bin/bash

# Define the argon2 hash for the default development password 'test'
PW_HASH='$argon2id$v=19$m=16,t=2,p=1$RG1EbDBCOTV3Y012cXFmVg$Yb47uU3Gy+L4DRh7tec78g'

# Check if an input file was provided as an argument
if [ -z "$1" ]; then
    echo "Usage: $0 <sql_file>" >&2
    exit 1
fi

INPUT_FILE="$1"

# Verify the file exists before attempting to process it
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: File $INPUT_FILE not found." >&2
    exit 1
fi

# Process the SQL dump using awk and output the result to stdout
awk -v pw="$PW_HASH" '
BEGIN {
    FS="\t";
    OFS="\t";
    user_n=1;
    state="DEFAULT";
}

state == "DEFAULT" {
    print $0;
    if ($0 ~ /^COPY lapis_dev\.user_account/) {
        state = "USER_ACCOUNT";
    } else if ($0 ~ /^COPY lapis_dev\.user_session/) {
        state = "USER_SESSION";
    }
    next;
}

state == "USER_ACCOUNT" {
    if ($0 ~ /^\\\./) {
        print $0;
        state = "DEFAULT";
        next;
    }
    # Anonymize: email, firstname, lastname, username, password
    $2 = "test.user" user_n "@oeaw.ac.at";
    $3 = "Test";
    $4 = "User" user_n;
    $5 = "tuser" user_n;
    $6 = pw;
    print $0;
    user_n++;
}

state == "USER_SESSION" {
    if ($0 ~ /^\\\./) {
        print $0;
        state = "DEFAULT";
    }
    # Entries inside the COPY block are skipped to clear sessions
}
' "$INPUT_FILE"
