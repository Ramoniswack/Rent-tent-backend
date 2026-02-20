# Firebase Service Account Configuration

## Security Notice

Firebase service account credentials should be stored as environment variables and NEVER committed to version control.

## Setup

Add these to your `.env` file:

```env
FIREBASE_PROJECT_ID=nomadnotesnp
FIREBASE_PRIVATE_KEY_ID=50aaab423a4887d5aea16dd1b77e3c349c8d0b9e
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCVJehaa6MRLWf9\n8G0ymOIumYSis7+fvsSvk8S9KduYmAPpEfSMKuUetqY9qPfjU8JK6wlMbXPLSGCu\non3Xfgouwlox4E7mFtNVDHAUTNoRTGzYfICzwWVQRxeGbInNmOBVD7W1OUeCRVBd\nbKm9jfisJrlOiFHjyg0p9NDROpCOp9eHGbl6cCnP4nsF1wKuUDixDfCnaTF+vl15\n+zBZlQb+WITOPMh8XQO3GWSr/jjb/03p06oIP3YkyL2RZdLSRvQ9Rxgio1E39CMW\nIYek3AKJ/qqu3qpB3Arr3s77PhDD5VnB7bPqcBCiGnrNKnRVa+Wh+C/taMjW+Cer\nU6ySH/9TAgMBAAECggEACMNN6AYb8hXrXrmiCM9/toIxj0elUhLoxnIVpJGRg+Em\nlaqG5jdc99V+ZfAIBHS23ST7CmEB5Scu+wO0BhWzLnUfzH9j01Py/bO54A913n9R\ng9So0SbjN3i90pmM7SX2xDikke24HFjLNHn+bRMq0Z6C07DhstL7vAPUwv5AYQk3\ng3m3aBdLOQizPx/N6yHzhc06AXTHiHUrVo2KUIMJ0j6ZYbiUE9/4GZh3SjhdL18q\nGZTynIs+a+zjUX7mJlzha1RLMz88SXWW2Og3T/mGqhF0CdWwtJxlczlubRsaOCr4\nmFe3UkxfU9hilvGGW8WAotdUWuD36aaBURybPuAzXQKBgQDF6G4CKFHAbWumUz67\nKIE5Yt7w2ZIZWMB4TumLIPXxE/BRDJCPLY38nXBkemjfm1Bx+laJfM86S7zu+RHt\na5lobzTIg2d+Toj/LrIBP04BmerK8tg94gxuPb2aJozP6oqYizZ0PnaG3NHJTTJD\nTA8iv+IpHrlarw8EY3FZweruBQKBgQDA7XkphXcMYjySSnnkmO6AM+fOhtC+6PH5\nh/TVQMaOM4Mvx4asXO8CNZRU4g6oFoqo9V6ZBA009JVhmc8mPVsFBrPVhRN/oGSj\nOQqnILhpaZqqOm5No2LWtqXM6ZmYqFet0AJdn0vnkPq+glJ1OvgkfktmoadMvUZA\nhsAo5VHfdwKBgDPe9J5aJPszcqiYXvO87Qm2cUpdLB66lU+zFyEhFXUHTdBgY68z\nOGjCdwfO0Zfx5EbLX00Pyly0JyPXYiyBLCckJoh7cG+5c8y2V29eQTrINbLVrXmi\nurFWO1Cg0/1WstbCfhY/nN9CFzYUppze3YS1GDjA1cH/6gazba0h10plAoGANxue\nIF4fQ0pMQv1DFCka90PcUwHvXpjrhXtwU/nMvZG5R0yXC2UAYIEtfZGU3i6SLPDp\ntIuTuiyi/t4QbbvY4/amJ7d7elk2ZelFQbf29SVVKIrINyUUdoB1m7KeTRzI7r0b\n7+IwrFSdSw2uwA24E7R/lTFXuHPYPVZATW4zlMECgYBqJRtbLXqtzJy+RD7lrdmf\n+bVIGpblz2wgax0tev2dwvqzaB/Mvc1QrtrOlaPNFUvDECm/3qYU9ngSsHSSAI0g\ncOpIXo9DDvKwAbsGhBN3XxxZpgIi1G7k1PLQ7KqvM12Y/IR4m6+qK7guFvPUuQ2L\nPKe+wzUdqcpFF/fqJfJiIg==\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@nomadnotesnp.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=112390655735728669745
```

## Getting Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Copy the values from the downloaded JSON to your `.env` file

## Important

- Never commit the `.env` file or service account JSON
- Rotate keys if accidentally exposed
- Use secure environment variable management in production
- Keep backups in a secure location (password manager, vault, etc.)

