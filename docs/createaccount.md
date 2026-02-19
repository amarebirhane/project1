How to Connect a Bank Account
Your app uses a manual/simulated bank connection (not a live Plaid/Open Banking integration). Here's the step-by-step:

Steps for Users
Go to Banking page → http://localhost:3000/banking
Click "Connect Account" button (top-right of the page)
The 
BankLinkModal
 opens — you fill in:
Bank — chosen from a list of Ethiopian banks (fetched from Chapa, with a fallback list)
Account Name — e.g. "My Business Account"
Last 4 digits of account number — e.g. 4231
Currency — e.g. ETB, USD
Submit → calls POST /api/v1/banking/accounts → saves the account to the database linked to the logged-in user
After Connecting
Once connected, the account card appears on the page with:

Available Balance (computed from transactions)
"Upload CSV" — import real bank statements as .csv
"Simulate Sync" — generates mock transactions (for testing)
"Webhook (Mock)" — simulates an incoming payment notification
"View Txns" — shows all transactions for that account
Important Notes
[!NOTE] This is a simulated/mock integration — it doesn't connect to a real bank API. There's no OAuth or Plaid flow. Users manually register their account details and then import data via CSV upload or simulation buttons.

[!TIP] If you want a real bank integration, you'd need to integrate with an Open Banking provider like Chapa (already partially configured in services/chapa_service.py) or a service like Plaid/Mono for Ethiopian banks.

[!IMPORTANT] Data isolation is enforced — each user only sees bank accounts they connected themselves. Admins see all accounts.