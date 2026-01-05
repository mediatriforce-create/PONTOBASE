import Link from 'next/link'
import styles from './page.module.css'

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={`${styles.hero} glass animate-fade-in`}>
        <div className={styles.content}>
          <h1 className={styles.title}>PONTOBASE</h1>
          <p className={styles.subtitle}>
            Controle de jornada corporativo inteligente, seguro e isolado.
          </p>

          <div className={styles.actions}>
            <Link href="/login" className="btn btn-primary">
              Acessar Sistema
            </Link>
            <Link href="/register" className="btn btn-outline">
              Criar Nova Conta
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
