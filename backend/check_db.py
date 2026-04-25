import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def check_db():
    DATABASE_URL = "postgresql+psycopg://postgres:1234@localhost/postgres"
    engine = create_async_engine(DATABASE_URL)
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT count(*) FROM expenses"))
        count = result.scalar()
        print(f"Total expenses: {count}")
        
        result = await conn.execute(text("SELECT * FROM expenses LIMIT 5"))
        rows = result.all()
        print(f"Sample rows: {rows}")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_db())
