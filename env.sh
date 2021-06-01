ENV=$1

echo "Loading settings from pass for env: $ENV"
export MNEMONIC="$(pass wBAN/$ENV/bsc_mnemonic)"
export BSC_SCAN_API_KEY="$(pass wBAN/$ENV/bscscan_api_key)"
