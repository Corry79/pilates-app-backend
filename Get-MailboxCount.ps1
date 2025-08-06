
# Importa il modulo Exchange Online
Import-Module ExchangeOnlineManagement

# Connessione a Exchange Online
$UserCredential = Get-Credential
Connect-ExchangeOnline -UserPrincipalName $UserCredential.UserName -Password $UserCredential.Password

# Ottieni tutte le caselle di posta
$mailboxes = Get-Mailbox -ResultSize Unlimited

# Conta il numero di caselle di posta
$mailboxCount = $mailboxes.Count

# Stampa il numero di caselle di posta
Write-Output "Numero di caselle email: $mailboxCount"

# Disconnessione da Exchange Online
Disconnect-ExchangeOnline -Confirm:$false
