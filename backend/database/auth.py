import time
from cryptography.exceptions import InvalidSignature
from cryptography.fernet import InvalidToken, Fernet
from flask import current_app, g, request, session
from authlib.integrations.flask_client import OAuth

oauth = OAuth()


class LoginRequired(Exception):
    """Raised when the user must re-authenticate (token missing, corrupt, or expired)."""

    def __init__(self, message):
        self.message = message
        super().__init__(self.message)


def _token_expired(token:dict, leeway_seconds:int=60) -> bool:
    """Whether token is still still valid or not.
    Add a leeway tolerance to deal with clock inaccuracy.
    """
    exp_at = token.get('expires_at')
    if exp_at is None:
        return False
    return time.time() >= (exp_at - leeway_seconds)

def ensure_valid_token():
    """Return the current auth token (decrypted), refreshing it if needed.

    Raises LoginRequired when authentication is not possible so that callers
    deep in the call stack don't accidentally store a Response object.
    """
    token = session.get("oidc_auth_token")
    if not token or not token.get('id_token'):
        raise LoginRequired("Token missing.")

    enc_key_str = request.cookies.get("enc_key")

    # The browser may have removed the cookie, so we force a new login, since
    # we can't retrieve the encrypted token.
    if not enc_key_str:
        raise LoginRequired("Missing enc_key.")

    key = enc_key_str.encode()
    try:
        token = decrypt_token(token, key)
    except (InvalidToken, InvalidSignature) as e:
        raise LoginRequired("Token decryption failed: " + repr(e)) from e
    if _token_expired(token):
        current_app.logger.debug(f"TOKEN EXPIRED: {token}")
        refreshed = oauth.oidc.fetch_access_token(
            refresh_token=token['refresh_token'],
            grant_type='refresh_token'
        )
        session["oidc_auth_token"] = encrypt_token(refreshed, key)
        current_app.logger.debug(f"REFRESHED TOKEN: {refreshed}")
        token = refreshed
    return token

def encrypt_password(password: str, key: bytes) -> str:
    """Encrypt a password using the given fernet key."""
    return Fernet(key).encrypt(password.encode()).decode()


def decrypt_password(encrypted: str, key: bytes) -> str:
    """Decrypt a password previously encrypted with encrypt_password."""
    return Fernet(key).decrypt(encrypted.encode()).decode()


_SENSITIVE_TOKEN_FIELDS = ("access_token", "refresh_token", "id_token")


def encrypt_token(token: dict, key: bytes) -> dict:
    """Encrypt sensitive fields of an OIDC token dict."""
    encrypted = dict(token)
    # We only encrypt sensitive data. Stuff like "expired" is left plaintext,
    # simplyfing code that uses it.
    for field in _SENSITIVE_TOKEN_FIELDS:
        if value := encrypted.get(field):
            encrypted[field] = encrypt_password(value, key)
    return encrypted


def decrypt_token(token: dict, key: bytes) -> dict | None:
    """Decrypt sensitive fields of an OIDC token dict."""
    decrypted = dict(token)
    for field in _SENSITIVE_TOKEN_FIELDS:
        if value := decrypted.get(field):
            decrypted[field] = decrypt_password(value, key)
        else:
            raise LoginRequired("Missing field in encrypted token: " + field)
    return decrypted

def get_username():
    "Retrieve username either from connection info or ID token."
    names = get_usernames()
    return names[0] if names else None

def get_usernames():
    "Retrieve possible user names."
    names = [g.conn.username] if hasattr(g.conn, "username") and g.conn.username else []
    if not names and g.conn.token:
        userinfo = oauth.oidc.userinfo(token = g.conn.token)
        current_app.logger.debug(f"userinfo::::::::::::::::::::::: {userinfo}")

        for key in ['email', 'name', 'sub']:
            if val := userinfo.get(key):
                names.append(val)
    return names
