```mermaid
flowchart TD
    A[Player Harvest]
    B[Validate Harvest Time]
    C[Update farm_plots status]
    D[Add coins to farm_users]
    E[Insert farm_actions log]
    F[Update farm_user_tasks progress]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F


```