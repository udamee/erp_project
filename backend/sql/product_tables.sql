CREATE TABLE "PRODUCT" (
                           "PRODUCT_ID"	INTEGER		NOT NULL,
                           "PRODUCT_CODE"	VARCHAR(50)		NOT NULL,
                           "PRODUCT_NAME"	VARCHAR(150)		NOT NULL,
                           "MAKER_NAME"	VARCHAR(100)		NULL,
                           "UNIT"	VARCHAR(20)	DEFAULT 'EA'	NOT NULL,
                           "STANDARD_PURCHASE_PRICE"	DECIMAL(12,2)	DEFAULT 0	NOT NULL,
                           "STANDARD_SALES_PRICE"	DECIMAL(12,2)	DEFAULT 0	NOT NULL,
                           "IS_PRESCRIPTION"	CHAR(1)	DEFAULT 'N'	NOT NULL,
                           "STORAGE_TYPE"	VARCHAR(20)	DEFAULT 'ROOM'	NOT NULL,
                           "STATUS"	VARCHAR(20)	DEFAULT 'ACTIVE'	NOT NULL,
                           "CREATED_AT"	DATE		NULL,
                           "UPDATED_AT"	DATE		NULL
);


CREATE TABLE "PRODUCT_SPEC" (
                                "SPEC_ID"	INTEGER		NOT NULL,
                                "PRODUCT_ID"	INTEGER		NOT NULL,
                                "SPEC_NAME"	VARCHAR(100)		NOT NULL,
                                "DESCRIPTION"	VARCHAR(300)		NULL,
                                "USE_YN"	CHAR(1)	DEFAULT 'Y'	NOT NULL,
                                "CREATED_AT"	DATE		NULL
);

ALTER TABLE "PRODUCT" ADD CONSTRAINT "PK_PRODUCT" PRIMARY KEY (
                                                               "PRODUCT_ID"
    );

ALTER TABLE "PRODUCT_SPEC" ADD CONSTRAINT "PK_PRODUCT_SPEC" PRIMARY KEY (
                                                                         "SPEC_ID",
                                                                         "PRODUCT_ID"
    );

ALTER TABLE "PRODUCT_SPEC" ADD CONSTRAINT "FK_PRODUCT_TO_PRODUCT_SPEC_1" FOREIGN KEY (
                                                                                      "PRODUCT_ID"
    )
    REFERENCES "PRODUCT" (
                          "PRODUCT_ID"
        );

