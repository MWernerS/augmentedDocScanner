//Created by Blake Eastman
//see http://beastman.fastmail.com to get latest version
package ADS.test;

import java.security.SecureRandom;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Random;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

public class ECrypto {
	
	private byte[] key;
	private Random random;
	
	public ECrypto(byte[] key, int seek) {
		init(key, seek);
	}
	public ECrypto(byte[] key) {
		init(key, 0);
	}
	public ECrypto() {
		key = new byte[256];
		new SecureRandom().nextBytes(key);
		
		init(key, 0);
	}
	private void init(byte[] key, int seek)
	{
		setKey(key);
		seek(seek);
	}
	
	public void setKey(byte[] key)
	{
		try {
			MessageDigest hasher = MessageDigest.getInstance("sha-256");
			byte[] hashedKey = hasher.digest(key);
			int seed = new BigInteger(hashedKey).intValue();
			random = new Random(seed);
			this.key = key;
		} catch (NoSuchAlgorithmException e) {
			e.printStackTrace();
			throw new RuntimeException("ERROR: Failed setting crypto key.");
		}
	}
	public void resetKey()
	{
		setKey(key);
	}
	public byte[] getKey()
	{
		return key;
	}
	
	public void crypto(InputStream inputData, OutputStream outputData) throws IOException
	{
		int read;
		int write;
		byte[] randBytes = new byte[32];
		while(true)
		{
			read = inputData.read();
			if(read == -1)
				break;
			random.nextBytes(randBytes);
			write = read ^ hash(randBytes)[0];
			outputData.write(write);
		}

		inputData.close();
		outputData.close();
	}
	public void encryptAndEncode(InputStream inputData, OutputStream outputData) throws IOException
	{
		crypto(inputData, Base64.getEncoder().wrap(outputData));
	}
	public void decodeAndDecrypt(InputStream inputData, OutputStream outputData) throws IOException
	{
		crypto(Base64.getDecoder().wrap(inputData), outputData);
	}
	
	public void seek(int seek)
	{
		resetKey();
		while(seek-- > 0)
		{
			random.nextInt();
		}
	}
	
	public String encryptString(String plainText) throws IOException
	{
		byte[] plainBytes = stringToBytes(plainText);
		ByteArrayInputStream plainStream = new ByteArrayInputStream(plainBytes);
		ByteArrayOutputStream cipherStream = new ByteArrayOutputStream();
		encryptAndEncode(plainStream, cipherStream);
		byte[] cipherBytes = cipherStream.toByteArray();
		String cipherText = bytesToString(cipherBytes);
		return cipherText;
	}
	public String decryptString(String plainText) throws IOException
	{
		byte[] plainBytes = stringToBytes(plainText);
		ByteArrayInputStream plainStream = new ByteArrayInputStream(plainBytes);
		ByteArrayOutputStream cipherStream = new ByteArrayOutputStream();
		decodeAndDecrypt(plainStream, cipherStream);
		byte[] cipherBytes = cipherStream.toByteArray();
		String cipherText = bytesToString(cipherBytes);
		return cipherText;
	}
	
	public static byte[] stringToBytes(String s)
	{
		return s.getBytes(StandardCharsets.UTF_8);
	}
	public static String bytesToString(byte[] b)
	{
		return new String(b, StandardCharsets.UTF_8);
	}
	public static byte[] base64decode(String s)
	{
		return Base64.getDecoder().decode(stringToBytes(s));
	}
	public static String base64encode(byte[] b)
	{
		return bytesToString(Base64.getEncoder().encode(b));
	}
	public static String hash(String data) {
        return hex(hash(stringToBytes(data)));
	}
	public static String hex(byte[] data)
	{
		StringBuilder hexString= new StringBuilder();
		for (int i = 0; i < data.length; i++) {
            String hex = Integer.toHexString(0xff & data[i]);
            if(hex.length() == 1) 
              hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
	}
	public static byte[] hash(byte[] data) {
	    try{
	        MessageDigest digest = MessageDigest.getInstance("SHA-256");
	        byte[] hash = digest.digest(data);
	        return hash;
	    } catch(Exception ex){
	       throw new RuntimeException(ex);
	    }
	}
	public static int byteArrayToInt(byte[] bytes) {
        return ((bytes[0] & 0xFF) << 24) |
                ((bytes[1] & 0xFF) << 16) |
                ((bytes[2] & 0xFF) << 8) |
                ((bytes[3] & 0xFF) << 0);
    }
	public static byte[] intToByteArray(int value) {
        return new byte[] {
                (byte)(value >> 24),
                (byte)(value >> 16),
                (byte)(value >> 8),
                (byte)value };
    }
}
