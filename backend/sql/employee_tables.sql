CREATE TABLE employee (
                          "EMP_ID"	INTEGER		NOT NULL,
                          "LOGIN_ID"	VARCHAR(50)		NOT NULL,
                          "PASSWORD"	VARCHAR(255)		NOT NULL,
                          "EMP_NAME"	VARCHAR(50)		NOT NULL,
                          "PHONE"	VARCHAR(20)		NULL,
                          "EMAIL"	VARCHAR(100)		NULL,
                          "DEPT_ID"	INTEGER		NULL,
                          "ROLE_CODE"	VARCHAR(20)		NOT NULL,
                          "STATUS"	VARCHAR(20)	DEFAULT 'ACTIVE'	NOT NULL,
                          "HIRE_DATE"	DATE		NULL,
                          "CREATED_AT"	DATE		NULL,
                          "UPDATED_AT"	DATE		NULL
);

CREATE TABLE "DEPARTMENT" (
                              "DEPT_ID"	INTEGER		NOT NULL,
                              "DEPT_NAME"	VARCHAR(50)		NOT NULL,
                              "DESCRIPTION"	VARCHAR(300)		NULL,
                              "USE_YN"	CHAR(1)	DEFAULT 'Y'	NOT NULL,
                              "CREATED_AT"	DATE		NULL
);