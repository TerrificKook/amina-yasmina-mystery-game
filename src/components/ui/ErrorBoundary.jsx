import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Ошибка игры:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="error-boundary">
          <section>
            <p className="eyebrow">Игра не запустилась</p>
            <h1>Вместо пустого экрана</h1>
            <p>
              Браузер поймал ошибку при запуске игры. Попробуйте обновить страницу. Если
              ошибка повторится после публикации, проверьте, что GitHub Pages публикует
              сборку через GitHub Actions.
            </p>
            <pre>{this.state.error.message}</pre>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
